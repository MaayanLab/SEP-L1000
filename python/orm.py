# ORMs for the database behind SEP-L1000
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import ForeignKey, Column, Integer, String, Table, Float, Text, DATETIME
from sqlalchemy.orm import backref, relationship
from sqlalchemy.orm import sessionmaker


db_config = 'mysql://root:@localhost/sep'
engine = create_engine(db_config)
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
session = Session()

## ORMs of the database
Base = declarative_base()


class Prediction(Base):
	"""predicted drug-se connection"""
	__tablename__ = 'prediction'
	drug_id = Column(Integer, ForeignKey('drugs_lincs.id'), primary_key=True)
	se_id = Column(Integer, ForeignKey('side_effects.id'), primary_key=True)
	p_val = Column(Float)
	side_effect = relationship("SideEffect")


class KnownConnection(Base):
	"""Known drug-se connection from SIDER"""
	__tablename__ = 'sider_connections'
	drug_id = Column(Integer, ForeignKey('drugs_lincs.id'), primary_key=True)
	se_id = Column(Integer, ForeignKey('side_effects.id'), primary_key=True)
	known_side_effect = relationship("SideEffect")


class DrugLINCS(Base):
	__tablename__ = 'drugs_lincs'

	id = Column(Integer, primary_key=True)
	pert_id = Column(String(32), unique=True)
	alt_name = Column(String(255))
	pert_iname = Column(String(255))
	LSM_id = Column(String(16))
	mls_id = Column(String(16))
	ncgc_id = Column(String(16))
	pert_collection = Column(String(16))
	pert_icollection = Column(String(16))
	pert_summary = Column(Text)
	pert_url = Column(Text)
	pubchem_cid = Column(String(16))
	canonical_smiles = Column(Text)
	inchi_key = Column(Text)
	inchi_string = Column(Text)
	molecular_formula = Column(Text)
	molecular_wt = Column(Float)
	structure_url = Column(Text)

	side_effects = relationship('Prediction')
	known_side_effects = relationship('KnownConnection')

	def __repr__(self):
		return "<DrugLINCS(pert_id='%s', pert_iname='%s')>" % (self.pert_id, self.pert_iname)


class SideEffect(Base):
	__tablename__ = 'side_effects'

	id = Column(Integer, primary_key=True)
	umls_id = Column(String(16), unique=True)
	name = Column(String(256))
	synonyms = Column(Text)
	auroc = Column(Float)
	soc = Column(String(128))

	def __repr__(self):
		return "<SideEffect(name='%s')>" % self.name


### below are classes that are not connected to other tables
class SOC(Base):
	__tablename__ = 'soc'
	id = Column(Integer, primary_key=True)
	name = Column(String(128), unique=True)
	color = Column(String(8))


class DrugDrugbank(Base):
	__tablename__ = 'drugs_drugbank'

	id = Column(Integer, primary_key=True)
	drugbank_id = Column(String(32), unique=True)
	name = Column(String(64))
	pubchem_cid = Column(String(32))
	pharmgkb_id = Column(String(16))


class DrugStitch(Base):
	__tablename__ = 'drugs_stitch'

	id = Column(Integer, primary_key=True)
	stitch_id = Column(String(32), unique=True)
	name = Column(String(128))
	smile_string = Column(Text)
	pubchem_cid = Column(String(32))


Base.metadata.create_all(engine)


## functions to add and retrieve objects 
def get_or_create(session, model, **kwargs):
	# init a instance if not exists
	# http://stackoverflow.com/questions/2546207/does-sqlalchemy-have-an-equivalent-of-djangos-get-or-create
	instance = session.query(model).filter_by(**kwargs).first()
	if instance:
		return instance
	else:
		instance = model(**kwargs)
		session.add(instance)
		session.commit()
		return instance	

def add_predictions(se_names, aucs, pert_id, coefs, session):
	# add predictions into the database
	drug = get_or_create(session, DrugLINCS, pert_id=pert_id)

	for coef, se_name, auc in zip(coefs, se_names, aucs):
		a = Prediction(p_val=coef)
		a.side_effect = get_or_create(session, SideEffect, name=se_name)
		if a.side_effect.auroc is None:
			a.side_effect.auroc = auc
		drug.side_effects.append(a)
	try:
		session.add(drug)
		session.commit()
	except Exception as e:
		session.rollback()
		print e
		pass
	return

def add_associations(se_ids, pert_id, session):
	# add known associations into the database
	drug = get_or_create(session, DrugLINCS, pert_id=pert_id)

	for se_id in se_ids:
		a = KnownConnection()
		a.known_side_effect = get_or_create(session, SideEffect, umls_id=se_id)
		drug.known_side_effects.append(a)
	try:
		session.add(drug)
		session.commit()
	except Exception as e:
		session.rollback()
		print e
		pass
	return

