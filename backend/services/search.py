from elasticsearch import Elasticsearch
from typing import List, Dict, Any
import os

class SearchService:
    def __init__(self):
        self.es = Elasticsearch(os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200'))
        self.index = 'candidates'
        self._ensure_index()

    def _ensure_index(self):
        """Ensure the index exists with proper mappings"""
        if not self.es.indices.exists(index=self.index):
            mappings = {
                "properties": {
                    "name": {"type": "text"},
                    "skills": {
                        "type": "text",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "experience": {"type": "text"},
                    "education": {"type": "text"},
                    "location": {"type": "keyword"},
                    "current_role": {"type": "text"},
                    "summary": {"type": "text"}
                }
            }
            self.es.indices.create(index=self.index, mappings=mappings)

    def _build_bool_query(self, query_groups: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Build an Elasticsearch bool query from query groups"""
        bool_query = {
            "bool": {
                "must": [],
                "should": [],
                "must_not": []
            }
        }

        for group in query_groups:
            group_terms = []
            
            for term in group["terms"]:
                term_query = {
                    "multi_match": {
                        "query": term["value"],
                        "fields": ["skills^3", "experience^2", "summary", "current_role"],
                        "type": "phrase"
                    }
                }

                if term["operator"] == "NOT":
                    bool_query["bool"]["must_not"].append(term_query)
                else:
                    group_terms.append(term_query)

            if group_terms:
                group_clause = {
                    "bool": {
                        "should" if group["operator"] == "OR" else "must": group_terms,
                        "minimum_should_match": 1 if group["operator"] == "OR" else None
                    }
                }

                if group.get("parentheses"):
                    # Wrap in a separate bool query to maintain grouping
                    bool_query["bool"]["must"].append({"bool": {"must": [group_clause]}})
                else:
                    bool_query["bool"]["must"].append(group_clause)

        return bool_query

    async def search_candidates(self, query_groups: List[Dict[str, Any]], page: int = 1, size: int = 20) -> Dict[str, Any]:
        """Search candidates using boolean query groups"""
        try:
            query = self._build_bool_query(query_groups)
            
            response = self.es.search(
                index=self.index,
                query=query,
                from_=(page - 1) * size,
                size=size,
                track_total_hits=True
            )

            return {
                "total": response["hits"]["total"]["value"],
                "results": [
                    {
                        "id": hit["_id"],
                        "score": hit["_score"],
                        **hit["_source"]
                    }
                    for hit in response["hits"]["hits"]
                ],
                "page": page,
                "size": size
            }
        except Exception as e:
            print(f"Search error: {str(e)}")
            return {
                "total": 0,
                "results": [],
                "page": page,
                "size": size,
                "error": str(e)
            }

    async def index_candidate(self, candidate: Dict[str, Any]) -> Dict[str, Any]:
        """Index a candidate document"""
        try:
            response = self.es.index(
                index=self.index,
                document=candidate
            )
            return {"success": True, "id": response["_id"]}
        except Exception as e:
            return {"success": False, "error": str(e)} 