# to make canvas/network of SEs based on predicted drugs
import os, sys
import MySQLdb
import numpy as np

from os.path import expanduser

HOME = expanduser("~")
sys.path.append(HOME + '/Documents/bitbucket/maayanlab_utils')
from fileIO import read_df, mysqlTable2dict, write_gmt


d_pt_umls = mysqlTable2dict('sep', 'side_effects', 2, 1)
# d_umls_pt = mysqlTable2dict('sep', 'side_effects', 1, 2)
# for pt, umls in d_pt_umls.items():
# 	if umls is None:
# 		print pt

# p_vals from the latest prediction
## get AUC for each side_effect

aucs = np.loadtxt('D:/Zichen_Projects/drug_se_prediction/training_set_no_mfc/PTs/ExtraTrees100_RLogit_GO + MACCS_per-label_AUC_n794x1053.txt').mean(axis=1)
print len(aucs)
print np.percentile(aucs, 75)
print aucs[aucs > 0.75].shape

mat, pert_ids, se_names = read_df('D:/Zichen_Projects/drug_se_prediction/training_set_no_mfc/PTs/PTs_ETs100_proba_df_n20338x1053.txt')
AUC_CUTOFF = 0.75
P_CUTOFF = 0.75 # probability cutoff
print mat.shape

m = aucs > AUC_CUTOFF
mat = mat[:, m]
se_names = np.array(se_names)[m]
print mat.shape

## make gmt file with se as terms and drugs as genes
ses_to_exclude = set()
d_se_drugs = {}
pert_ids = np.array(pert_ids)
for se, p_vals in zip(se_names, mat.T):
	mask = p_vals > P_CUTOFF
	if mask.sum() > 5000:
		print se, mask.sum()
		ses_to_exclude.add(se)
	else:
		drugs = pert_ids[mask]
		d_se_drugs[se] = drugs

write_gmt(d_se_drugs, HOME+'/Documents/N2C/Sets2Networks/ET100_GOtCS_AUC_%s_proba_%s_flip.gmt' %(AUC_CUTOFF, P_CUTOFF))


## make gmt file with drug as term and se as genes
d_drug_ses = {}
for pert_id, p_vals in zip(pert_ids, mat):
	mask = p_vals > P_CUTOFF
	SEs = [d_pt_umls[pt] for pt in se_names[mask] if d_pt_umls[pt] is not None and pt not in ses_to_exclude]
	if len(SEs) != 0:
		d_drug_ses[pert_id] = SEs

write_gmt(d_drug_ses, HOME+'/Documents/N2C/Sets2Networks/ET100_GOtCS_AUC_%s_proba_%s.gmt' %(AUC_CUTOFF, P_CUTOFF))


