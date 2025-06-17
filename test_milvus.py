from pymilvus import connections, Collection, CollectionSchema, FieldSchema, DataType, utility
import random

# Connect to Milvus
connections.connect(host='localhost', port='19530')

# Collection parameters
collection_name = 'test_collection'
dim = 128

# Drop collection if it exists
if utility.has_collection(collection_name):
    utility.drop_collection(collection_name)

# Define schema
id_field = FieldSchema(name='id', dtype=DataType.INT64, is_primary=True, auto_id=False)
vector_field = FieldSchema(name='vector', dtype=DataType.FLOAT_VECTOR, dim=dim)
schema = CollectionSchema(fields=[id_field, vector_field], description='Test collection')

# Create collection
collection = Collection(name=collection_name, schema=schema)

# Insert data
num_entities = 1000
vectors = [[random.random() for _ in range(dim)] for _ in range(num_entities)]
ids = list(range(num_entities))
collection.insert([ids, vectors])

# Create index
index_params = {
    'metric_type': 'L2',
    'index_type': 'IVF_FLAT',
    'params': {'nlist': 128}
}
collection.create_index('vector', index_params)
collection.load()

# Perform searches
topK = 5
search_params = {'metric_type': 'L2', 'params': {'nprobe': 10}}
query_vector = [random.random() for _ in range(dim)]
for _ in range(10):
    results = collection.search(
        data=[query_vector],
        anns_field='vector',
        param=search_params,
        limit=topK
    )

print('Milvus test operations completed successfully!') 