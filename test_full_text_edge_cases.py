import unittest
from pymilvus import connections, Collection
from full_text_search import create_collection, search_resumes, insert_resume_data, COLLECTION_NAME, HOST, PORT

class TestFullTextEdgeCases(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test environment with a small set of resumes."""
        print("\n" + "="*80)
        print("Setting up Full Text Search Test Environment".center(80))
        print("="*80)
        
        # Connect to Milvus
        try:
            connections.connect(
                alias="default",
                host=HOST,
                port=PORT
            )
            print("[INFO] Client connected successfully")
        except Exception as e:
            print(f"[ERROR] Failed to connect to Milvus: {e}")
            raise
        
        # Create collection
        create_collection()
        print("[INFO] Collection created successfully")
        
        # Insert data
        print("\n[INFO] Starting data insertion...")
        if not insert_resume_data():
            print("[ERROR] Failed to insert data!")
            raise Exception("Data insertion failed")
        
        # Verify data was inserted
        collection = Collection(COLLECTION_NAME)
        stats = collection.describe()
        print(f"[INFO] Collection now contains {collection.num_entities} documents")
        
        if collection.num_entities == 0:
            print("[ERROR] No data was inserted!")
            raise Exception("No data in collection")
        
        print("[INFO] Data insertion completed successfully")
        print("-"*80)
        
        # Load collection once at the start
        collection.load()
        print("[INFO] Collection loaded for testing")

    def print_test_header(self, test_name):
        """Print a formatted header for each test."""
        print(f"\n{'-'*80}")
        print(f"Test: {test_name}".center(80))
        print(f"{'-'*80}")

    def print_query_result(self, query, results):
        """Print formatted query results."""
        print(f"\nQuery: '{query}'")
        print(f"Results found: {len(results)}")
        if results:
            print("\nTop matches:")
            for i, result in enumerate(results[:3], 1):
                print(f"{i}. Score: {result['score']:.4f}")
                print(f"   File: {result['filename']}")
                print(f"   Source: {result['source']}")
                if 'content' in result:
                    print(f"   Snippet: {result['content']}")
        print("-"*40)

    def test_empty_queries(self):
        """Test handling of empty and whitespace-only queries."""
        self.print_test_header("Empty Queries Test")
        empty_queries = ["", "   ", "\t", "\n", "  \t  \n  "]
        for query in empty_queries:
            results = search_resumes(query, source="pdf")
            self.assertEqual(len(results), 0, f"Empty query '{query}' should return no results")
            self.print_query_result(query, results)

    def test_boolean_operators(self):
        """Test boolean operator handling."""
        self.print_test_header("Boolean Operators Test")
        
        test_cases = [
            "Java AND Developer",  # Common in tech resumes
            "Sales OR Marketing",  # Common in business resumes
            "Project AND Manager", # Common in management resumes
            "Python AND Developer", # Common in tech resumes
            "Data AND Analyst"     # Common in data roles
        ]
        
        for query in test_cases:
            results = search_resumes(query, top_k=10)
            self.print_query_result(query, results)

    def test_special_characters(self):
        """Test handling of queries with special characters."""
        self.print_test_header("Special Characters Test")
        
        test_cases = [
            "C++",               # Common programming language
            "C#",                # Common programming language
            "Node.js",           # Common framework
            "React.js",          # Common framework
            "Python 3.x"         # Common version specification
        ]
        
        for query in test_cases:
            results = search_resumes(query, top_k=10)
            self.print_query_result(query, results)

    def test_fuzzy_search(self):
        """Test fuzzy search capabilities."""
        self.print_test_header("Fuzzy Search Test")
        
        test_cases = [
            "Java Develoer",      # Misspelled Developer
            "Sales Managr",       # Misspelled Manager
            "Python Develoer",    # Misspelled Developer
            "Data Analist",       # Misspelled Analyst
            "Projct Manager"      # Misspelled Project
        ]
        
        for query in test_cases:
            results = search_resumes(query, top_k=10)
            self.print_query_result(query, results)

    def test_wildcards(self):
        """Test wildcard pattern matching."""
        self.print_test_header("Wildcards Test")
        
        test_cases = [
            "iOS*",
            "*Sales*",
            "Epic*",
            "*SAP*",
            "Project*"
        ]
        
        for query in test_cases:
            results = search_resumes(query, top_k=10)
            self.print_query_result(query, results)

    def test_whitespace_handling(self):
        """Test handling of various whitespace patterns."""
        self.print_test_header("Whitespace Handling Test")
        
        test_cases = [
            "iOS  Developer",  # Double space
            "Sales\tDirector",  # Tab
            "Epic\nDirector",  # Newline
            "SAP  Project  Manager",  # Multiple spaces
            "Project\t\tManager"  # Multiple tabs
        ]
        
        for query in test_cases:
            results = search_resumes(query, top_k=10)
            self.print_query_result(query, results)

if __name__ == '__main__':
    unittest.main(verbosity=2) 