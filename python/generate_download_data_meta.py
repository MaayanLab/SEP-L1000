'''
Generate meta-data for data available for download
'''
import os, sys, json
import gzip
import hashlib
import numpy as np
import pandas as pd


fields = ['short_name', 'Name', 'Description', 'Rows', 'Columns',
	'Size(MB)', 'md5', 'Source', 'Reference', 'path']


class DataFile(object):
	def __init__(self, fn):
		self.name = fn.split('/')[-1]
		
		self._path = '../downloads/' + fn
		self.desc = ''
		self.df = pd.read_csv(self._path, compression='gzip')
		self.rows, self.columns = self.df.shape

		self.md5 = hashlib.md5(open(self._path, 'rb').read()).hexdigest()
		self.size = os.path.getsize(self._path)
		self.size = '%.1f' % (self.size / (1024. * 1024)) # size in MB
		self.ref = ''
		self.source_url = ''
		self.path = 'downloads/' + fn

	def to_record(self):
		record = {
			'short_name': self.name.split('_')[0],
			'Name': self.name,
			'Description': self.desc,
			'Rows': self.rows,
			'Columns': self.columns,
			'Size(MB)': self.size,
			'md5': self.md5,
			'Source': self.source_url,
			'Reference': self.ref,
			'path': self.path,
		}
		return record 

records = []
for fn in os.listdir('../downloads/'):
	if fn.endswith('.gz'):
		print fn
		d = DataFile(fn)
		record = d.to_record()
		records.append(record)

meta_for_data = pd.DataFrame.from_records(records)
meta_for_data = meta_for_data[fields]
meta_for_data = meta_for_data.sort('Name')

descs = [
'Processed drug side effects data from FDA Adverse Event Report System (FAERS) using Propensity Score Matching (PSM) based methods to correct for unknown or unmeasured covariates in the spontaneous reporting systems.',
'Gene Ontology (GO) transformed gene expression profiles of drug/small molecule compound perturbations. Principal Angel Enrichment Analysis (PAEA) was used to compute enrichment p-values for each CD signature in the space of all genes against gene sets created from the Gene Ontology including Biological Processes, Cellular Components and Molecular Function.',
'Gene expression signatures for drugs/small molecule compounds in the landmark gene space. The Characteristic Direction (CD) method was used to compute gene expression signatures.',
'166-bit MACCS chemical fingerprint matrix for drugs/small molecule compounds computed using Open Babel.',
'Drug/small molecule compound induced cell morphological profiles.',
'Drug-ADR connections mined from drug package inserts from SIDER.',
]

urls = [
'https://www.pharmgkb.org/downloads/', 
None,
'http://www.lincscloud.org/l1000/',
None,
'https://www.broadinstitute.org/scientific-community/science/programs/csoft/therapeutics-platform/mlpcn/accessing-mlpcn-data',
'ftp://xi.embl.de/SIDER/2012-10-17/'
]

pmids = [
'22422992',
None,
None,
None,
'24710340',
'20087340'
]

meta_for_data['Description'] = descs
meta_for_data['Source'] = urls
meta_for_data['Reference'] = pmids

meta_for_data.to_json('../data/download_data.json', orient='records')


