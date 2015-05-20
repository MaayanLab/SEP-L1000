## make MDS plot to visualize network
import os, sys
import numpy as np
import matplotlib.pyplot as plt
from sklearn import manifold
import networkx as nx

from matplotlib import rcParams
rcParams['pdf.fonttype'] = 42 ## Output Type 3 (Type3) or Type 42 (TrueType)
rcParams['font.sans-serif'] = 'Arial'

import json
import MySQLdb
import cPickle as pickle
from itertools import combinations
from collections import Counter
from pprint import pprint

from os.path import expanduser
HOME = expanduser("~")
sys.path.append(HOME + '/Documents/bitbucket/maayanlab_utils')
from fileIO import read_df, read_gmt, mysqlTable2dict
from plots import COLORS20, COLORS20b


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


def network_layout(df, outfn=None):
	## make a Graph object and write to gml for Gephi to 
	## do the layout
	dissimilarity_matrix, ids, _ = read_df(df)
	adj_matrix = 1 - dissimilarity_matrix
	degrees = adj_matrix.sum(axis=0) - 1
	m = adj_matrix > 0.95
	adj_matrix = adj_matrix * m
	G = nx.from_numpy_matrix(adj_matrix)

	for i in range(adj_matrix.shape[0]):
		G.node[i]['size'] = degrees[i]
		G.node[i]['id'] = ids[i]

	if outfn is not None:	
		nx.write_gml(G, outfn)
	return G


def make_network_json(layout_df, d_id_name, d_id_category, outfn=None):
	## wrapper for making a json for viewing
	COLORS40 = COLORS20 + COLORS20b
	print len(COLORS40)
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
			size = float(sl[size_idx]) * 20
			name = d_id_name[id]
			category = d_id_category[id]
			if category not in all_categories:
				all_categories.append(category)
			color_idx = all_categories.index(category)
			color = COLORS40[color_idx][1:]
			obj = {'id':id, 'x':x, 'y':y, 'size':size, 'label':name, 'category':category, 'color':color}
			objs.append(obj)
	json.dump(objs, open(outfn, 'wb'))
	return



# DF_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/ET100_GOtCS_AUC_0.75_proba_0.75_significance_scores_matrix.txt'
DF_FN =HOME+'/Documents/Zichen_Projects/drug_se_prediction/Sets2Networks/ET100_GOtCS_AUC_0.7_proba_0.75_prediction_only_flipped_significance_scores_matrix.txt'
GML_FN = HOME+'/Documents/Zichen_Projects/drug_se_prediction/side_effect_network.gml'
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


# G = network_layout(DF_FN, outfn=GML_FN)
make_network_json(CSV_FN, d_umls_pt, d_umls_soc, outfn=JSON_FN)

