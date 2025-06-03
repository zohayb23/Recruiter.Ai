import unittest
from dense_search import model, Collection, connections
from sentence_transformers import SentenceTransformer
import os

class TestDenseEdgeCases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test environment with a small set of resumes."""
        print("\n" + "="*80)
        print("Setting up Dense Search Test Environment".center(80))
        print("="*80)
        
        # Connect to Milvus
        connections.connect(alias="default", host="localhost", port="19530")
        
        # Get collection
        cls.collection = Collection("resume_embeddings")
        cls.collection.load()
        print("[INFO] Collection loaded successfully")
        print("-"*80)

    def print_test_header(self, test_name):
        """Print a formatted header for each test."""
        print(f"\n{'-'*80}")
        print(f"Test: {test_name}".center(80))
        print(f"{'-'*80}")

    def print_query_result(self, query, results):
        """Print formatted query results."""
        print(f"\nQuery: '{query}'")
        print(f"Results found: {len(results[0])}")
        if results[0]:
            print("\nTop matches:")
            for i, hit in enumerate(results[0][:3], 1):
                print(f"{i}. Score: {hit.distance:.4f}")
                print(f"   File: {hit.entity.get('filename')}")
                print(f"   Source: {hit.entity.get('source')}")
        print("-"*40)

    def perform_search(self, query, top_k=5):
        """Perform a search using the collection."""
        embedding = model.encode([query])
        results = self.collection.search(
            data=embedding,
            anns_field="embedding",
            param={"metric_type": "L2", "params": {"nprobe": 10}},
            limit=top_k,
            output_fields=["filename", "source"]
        )
        return results

    def test_semantic_similarity(self):
        """Test semantic similarity with different phrasings."""
        self.print_test_header("Semantic Similarity Test")
        semantic_queries = [
            "iOS Developer",
            "Sales Director",
            "VP of Sales",
            "Epic Director",
            "SAP Project Manager"
        ]
        for query in semantic_queries:
            results = self.perform_search(query)
            self.assertIsNotNone(results, "Search should not return None")
            self.print_query_result(query, results)

    def test_skill_similarity(self):
        """Test semantic similarity of related skills."""
        self.print_test_header("Skill Similarity Test")
        skill_queries = [
            "iOS development",
            "sales leadership",
            "healthcare IT",
            "SAP implementation",
            "project management"
        ]
        for query in skill_queries:
            results = self.perform_search(query)
            self.assertIsNotNone(results, "Search should not return None")
            self.print_query_result(query, results)

    def test_experience_similarity(self):
        """Test semantic similarity of experience descriptions."""
        self.print_test_header("Experience Similarity Test")
        experience_queries = [
            "vice president",
            "director level",
            "senior manager",
            "team lead",
            "project manager"
        ]
        for query in experience_queries:
            results = self.perform_search(query)
            self.assertIsNotNone(results, "Search should not return None")
            self.print_query_result(query, results)

    def test_education_similarity(self):
        """Test semantic similarity of education and qualifications."""
        self.print_test_header("Education Similarity Test")
        education_queries = [
            "bachelor's degree",
            "master's degree",
            "MBA",
            "certified professional",
            "technical certification"
        ]
        for query in education_queries:
            results = self.perform_search(query)
            self.assertIsNotNone(results, "Search should not return None")
            self.print_query_result(query, results)

    def test_technology_similarity(self):
        """Test semantic similarity of technology stacks."""
        self.print_test_header("Technology Similarity Test")
        tech_queries = [
            "iOS Swift",
            "SAP Cloud",
            "Epic MyChart",
            "healthcare systems",
            "sales management"
        ]
        for query in tech_queries:
            results = self.perform_search(query)
            self.assertIsNotNone(results, "Search should not return None")
            self.print_query_result(query, results)

if __name__ == '__main__':
    unittest.main(verbosity=2) 