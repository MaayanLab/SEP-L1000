# to transfer data from the old database `maaya0_SEP` to the new one `sep`
from orm import *

import os, sys
import MySQLdb
import numpy as np

from os.path import expanduser

HOME = expanduser("~")
sys.path.append(HOME + '/Documents/bitbucket/maayanlab_utils')
from fileIO import read_df, mysqlTable2dict


def _strip_string(s):
	if type(s) == str:
		if s == 'NULL':
			return None
		else:
			return s.strip()
	else:
		return s


def transfer_table(table_name, model, session):
	conn = MySQLdb.connect(host='localhost',user='root', passwd='',db='maaya0_SEP')
	cur = conn.cursor()
	query = """SELECT * FROM `%s`""" %table_name
	cur.execute(query)
	num_fields = len(cur.description)
	field_names = [i[0] for i in cur.description]

	for row in cur:
		row = map(_strip_string, row)
		kwargs = dict(zip(field_names, row))
		instance = get_or_create(session, model, **kwargs)
	return

## transfer drug tables
transfer_table('drugs_lincs', DrugLINCS, session)
transfer_table('drugs_drugbank', DrugDrugbank, session)
transfer_table('drugs_stitch', DrugStitch, session)


# p_vals from the latest prediction
## get AUC for each side_effect

aucs = np.loadtxt(HOME + '/Documents/Zichen_Projects/drug_se_prediction/ExtraTrees100_RLogit_GO + MACCS_per-label_AUC_n794x1053.txt').mean(axis=1)
print len(aucs)
print np.percentile(aucs, 75)
print aucs[aucs > 0.7].shape

mat, pert_ids, se_names = read_df(HOME + '/Documents/Zichen_Projects/drug_se_prediction/PTs_ETs100_proba_df_n20338x1053.txt')
print mat.shape
se_names = np.array(se_names)

d_se_auc = dict(zip(se_names, aucs))

## transfer side_effects and add AUROC 
conn = MySQLdb.connect(host='localhost',user='root', passwd='',db='maaya0_SEP')
cur = conn.cursor()
query = """SELECT * FROM `%s`""" %'side_effects'
cur.execute(query)
num_fields = len(cur.description)
field_names = [i[0] for i in cur.description]

for row in cur:
	row = map(_strip_string, row)
	kwargs = dict(zip(field_names, row))
	if kwargs['name'] in d_se_auc:
		kwargs['auroc'] = d_se_auc[kwargs['name']]
	else:
		kwargs['auroc'] = None
	instance = get_or_create(session, SideEffect, **kwargs)


for pvals, pert_id in zip(mat, pert_ids):
	mask = pvals > 0.5
	se_names_pos = se_names[mask].tolist()
	aucs_pos = aucs[mask].tolist()
	pvals_pos = pvals[mask].tolist()
	add_predictions(se_names_pos, aucs_pos, pert_id, pvals_pos, session)



## transfer association tables
# sider_connections
d_pert_ids = mysqlTable2dict('maaya0_SEP', 'drugs_lincs', 0, 1)
d_umls_id = mysqlTable2dict('maaya0_SEP', 'side_effects', 0, 1)

conn = MySQLdb.connect(host='localhost',user='root', passwd='',db='maaya0_SEP')
cur = conn.cursor()
query = """SELECT * FROM `%s`""" %'sider_connections'
cur.execute(query)
d_pert_umls_ids = {}
for row in cur:
	pert_id, umls_id = row
	if pert_id in d_pert_ids and umls_id in d_umls_id:
		if pert_id not in d_pert_umls_ids:
			d_pert_umls_ids[pert_id] = [umls_id]
		else:
			if umls_id not in d_pert_umls_ids[pert_id]:
				d_pert_umls_ids[pert_id].append(umls_id)
conn.close()

print len(d_pert_umls_ids)
for pert_id, se_ids in d_pert_umls_ids.items():
	add_associations(se_ids, pert_id, session)


