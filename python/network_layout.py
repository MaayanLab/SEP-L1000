## make MDS plot to visualize network
import os, sys
import numpy as np
import matplotlib.pyplot as plt
from sklearn import manifold
import networkx as nx
from networkx.readwrite import json_graph
from sklearn.preprocessing import LabelBinarizer
from sklearn.cluster import AgglomerativeClustering

from matplotlib import rcParams
rcParams['pdf.fonttype'] = 42 ## Output Type 3 (Type3) or Type 42 (TrueType)
rcParams['font.sans-serif'] = 'Arial'

import json
import MySQLdb
import cPickle as pickle
from itertools import combinations
from collections import Counter
from pprint import pprint
from scipy.stats import pearsonr

from os.path import expanduser
HOME = expanduser("~")
sys.path.append(HOME + '/Documents/bitbucket/maayanlab_utils')
from fileIO import read_df, read_gmt, mysqlTable2dict, write_gmt
from plots import COLORS20, COLORS20b
from GMTtools import jaccard_matrix, flip_gmt


def mds(dissimilarity_matrix, plot=False):
	## calc coordinates with MDS
	mds = manifold.MDS(n_components=2, dissimilarity="precomputed", n_init=4)
	nmds = manifold.MDS(metric=False, n_components=2, dissimilarity="precomputed", n_init=1)
	mds.fit(dissimilarity_matrix)
	pos = mds.embedding_
	npos = nmds.fit_transform(dissimilarity_matrix, init=pos)

	## get degrees for nodes
	adj_matrix = 1 - dissimilarity_matrix
	degrees = adj_matrix.sum(axis=0) - 1
	
	if plot:
		fig = plt.figure(figsize=(10,6))
		ax1 = fig.add_subplot(121)
		ax2 = fig.add_subplot(122)
		ax1.scatter(pos[:,0], pos[:,1], s=degrees/50.)
		ax2.scatter(npos[:,0], npos[:,1], s=degrees/50.)
		plt.show()
	return npos, degrees


def network_layout(gmt_fn, outfn=None):
	## make a Graph object and write to gml for Gephi to 
	## do the layout

	d_gmt = read_gmt(gmt_fn)
	d_gmt_filt = {}
	for term, genes in d_gmt.items():
		if len(genes) >= 5:
			d_gmt_filt[term] = genes
	d_gmt = d_gmt_filt

	print 'number of terms:', len(d_gmt)
	umls_ids_kept = d_gmt.keys()
	adj_matrix = jaccard_matrix(d_gmt)

	m = adj_matrix > 0.2
	# degrees = adj_matrix.sum(axis=0)
	adj_matrix = adj_matrix * m.astype(int)
	
	G = nx.from_numpy_matrix(adj_matrix)

	print 'G: ',G.number_of_edges(), G.number_of_nodes()

	for i in range(adj_matrix.shape[0]):
		# G.node[i]['size'] = degrees[i]
		# G.node[i]['size'] = len(d_gmt[umls_ids_kept[i]])
		G.node[i]['size'] = G.degree(i)
		G.node[i]['id'] = umls_ids_kept[i]

	if outfn is not None:	
		nx.write_gml(G, outfn)
	return G


def make_network_json(layout_df, d_id_name, d_id_category, d_category_color, outfn=None):
	## wrapper for making a json for viewing

	objs = []

	i = 0
	all_categories = []


	with open (layout_df) as f:
		header = next(f).split(',')
		id_idx = header.index('Id')
		size_idx = header.index('sizeFloat')
		x_idx = header.index('X-coordinateFloat')
		y_idx = header.index('Y-coordinateFloat')
		for line in f:
			sl = line.split(',')
			id = sl[id_idx]
			x = float(sl[x_idx])
			y = float(sl[y_idx])
			size = float(sl[size_idx]) * 35
			name = d_id_name[id]
			category = d_id_category[id]
			color = d_category_color[category]
			obj = {'id':id, 'x':x, 'y':y, 'size':size, 'label':name, 'color':color}
			objs.append(obj)
	json.dump(objs, open(outfn, 'wb'))
	return

def make_directed_json_graph(gmt_fn, d_id_name, d_id_category, d_category_color, outfn=None):
	# perform HC and make a directed graph and write to json
	# for pack visualization
	d_gmt = read_gmt(gmt_fn)
	d_gmt_filt = {}
	for term, genes in d_gmt.items():
		if len(genes) >= 5:
			d_gmt_filt[term] = genes
	d_gmt = d_gmt_filt

	print 'number of terms:', len(d_gmt)
	umls_ids_kept = d_gmt.keys()
	adj_matrix = jaccard_matrix(d_gmt)

	hc = AgglomerativeClustering(n_clusters=10)
	hc.fit(adj_matrix)

	m = adj_matrix > 0.2
	adj_matrix = adj_matrix * m.astype(int)
	Gu = nx.from_numpy_matrix(adj_matrix) # undirected Graph, to get size

	G = nx.DiGraph()
	for i in range(adj_matrix.shape[0]):
		cluster_label = hc.labels_[i]
		umls_id = umls_ids_kept[i]
		name = d_id_name[umls_id]
		G.add_edge('root', cluster_label)
		G.add_edge(cluster_label, umls_id)
		G.node[umls_id]['size'] = Gu.degree(i)
		G.node[umls_id]['label'] = name

		category = d_id_category[umls_id]
		color = d_category_color[category]
		G.node[umls_id]['color'] = color
	graph_data = json_graph.tree_data(G,root='root')
	json.dump(graph_data, open(outfn, 'wb'))
	return

def make_directed_json_graph_soc(gmt_fn, d_id_name, d_id_category, d_category_color, outfn=None):
	# make directed graph based on SOC - PT
	d_gmt = read_gmt(gmt_fn)
	d_gmt_filt = {}
	for term, genes in d_gmt.items():
		if len(genes) >= 5:
			d_gmt_filt[term] = genes
	d_gmt = d_gmt_filt

	print 'number of terms:', len(d_gmt)
	umls_ids_kept = d_gmt.keys()
	adj_matrix = jaccard_matrix(d_gmt)
	m = adj_matrix > 0.2
	adj_matrix = adj_matrix * m.astype(int)
	Gu = nx.from_numpy_matrix(adj_matrix) # undirected Graph, to get size
	G = nx.DiGraph()
	for i in range(len(umls_ids_kept)):
		umls_id = umls_ids_kept[i]
		name = d_id_name[umls_id]
		category = d_id_category[umls_id]
		color = d_category_color[category]

		G.add_edge('root', category)
		G.add_edge(category, umls_id)

		G.node[umls_id]['size'] = Gu.degree(i)
		G.node[umls_id]['label'] = name
		G.node[umls_id]['color'] = color		
	graph_data = json_graph.tree_data(G,root='root')
	json.dump(graph_data, open(outfn, 'wb'))
	return



# DF_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/ET100_GOtCS_AUC_0.75_proba_0.75_significance_scores_matrix.txt'
# DF_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/Sets2Networks/ET100_GOtCS_AUC_0.7_proba_0.75_prediction_only_flipped_significance_scores_matrix.txt'
# GMT_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/Sets2Networks/ET100_GOtCS_AUC_0.7_proba_0.75_prediction_only.gmt'

PREDICTION_DF = HOME + '/Documents/Zichen_Projects/drug_se_prediction/PTs_RF1000_proba_df_n20338x1053.txt'

## for side effects
# GMT_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/RF1000_GOtCS_AUC_0.7_proba_0.6_prediction_only.gmt'
GMT_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/RF100_GOtCS_AUC_0.7_proba_0.75.gmt' 
GML_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/side_effect_network.gml'
## for drugs
# GMT_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/RF1000_GOtCS_AUC_0.7_proba_0.6_prediction_only_flipped.gmt'
# GML_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/drug_network.gml'

CSV_FN = GML_FN.replace('.gml', '.csv')
JSON_FN = CSV_FN.replace('.csv', '.json')

## retrieve meta data about SE
d_umls_pt = mysqlTable2dict('sep', 'side_effects', 1, 2)
d_pt_umls = mysqlTable2dict('sep', 'side_effects', 2, 1)
d_soc_pt = read_gmt(HOME+'/Documents/bitbucket/pertid2trainingset/Y_matrix_no_mfc/SOC_to_pt.gmt')
print len(d_soc_pt)
d_umls_soc = {}
for soc, pts in d_soc_pt.items():
	for pt in pts:
		umls = d_pt_umls[pt]
		if umls is not None:
			if umls not in d_umls_soc:
				d_umls_soc[umls] = soc
			# else:
			# 	d_umls_soc[umls].append(soc) # one PT may have multiple SOCs

# for pt in d_umls_soc:
# 	if len(d_umls_soc[pt]) != 1:
# 		print pt, d_umls_soc[pt]

COLORS40 = COLORS20 + COLORS20b
COLORS40 = map(lambda x : x[1:], COLORS40) # remove "#"
d_soc_color = dict(zip(set(d_umls_soc.values()), COLORS40))

# pickle.dump(d_umls_soc, open(HOME+'/Documents/Zichen_Projects/drug_se_prediction/d_umls_soc.p', 'wb'))
# pickle.dump(d_soc_color, open(HOME+'/Documents/Zichen_Projects/drug_se_prediction/d_soc_color.p', 'wb'))

# d_gmt = read_gmt(GMT_FN)
# d_gmtT = flip_gmt(d_gmt)
# write_gmt(d_gmtT, HOME+'/Documents/Zichen_Projects/drug_se_prediction/RF1000_GOtCS_AUC_0.7_proba_0.6_prediction_only_flipped.gmt')


# G = network_layout(GMT_FN, outfn=GML_FN)

# make_network_json(CSV_FN, d_umls_pt, d_umls_soc, d_soc_color, outfn=JSON_FN)

# make directed graph for predicted SEs
# make_directed_json_graph(GMT_FN, d_umls_pt, d_umls_soc, d_soc_color, 
# 	outfn=HOME+'/Documents/Zichen_Projects/drug_se_prediction/side_effects_digraph_with_known.json')
make_directed_json_graph_soc(GMT_FN, d_umls_pt, d_umls_soc, d_soc_color, 
	outfn=HOME+'/Documents/Zichen_Projects/drug_se_prediction/side_effects_digraph_soc_with_known.json')


