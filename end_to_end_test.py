#!/usr/bin/env python3
"""
Comprehensive End-to-End Test for Recruiter.AI Platform
Tests all major features and functionality
"""

import requests
import json
import time
import sys
from datetime import datetime

class RecruiterAITester:
    def __init__(self):
        self.base_urls = {
            'mass_mailing': 'http://localhost:8810',
            'crm': 'http://localhost:8809', 
            'milvus': 'http://localhost:8804',
            'gcp_crm': 'http://34.31.224.102:8809',
            'gcp_mass_mailing': 'http://34.31.224.102:8810',
            'gcp_milvus': 'http://34.31.224.102:8804'
        }
        self.test_results = {}
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_endpoint(self, name, url, endpoint="/", method="GET", data=None):
        """Test a single endpoint"""
        try:
            full_url = f"{url}{endpoint}"
            self.log(f"Testing {name}: {full_url}")
            
            if method == "GET":
                response = requests.get(full_url, timeout=5)
            elif method == "POST":
                response = requests.post(full_url, json=data, timeout=5)
            
            if response.status_code == 200:
                self.log(f"✅ {name}: SUCCESS (Status: {response.status_code})")
                return True
            else:
                self.log(f"⚠️ {name}: Status {response.status_code}", "WARNING")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ {name}: FAILED - {str(e)}", "ERROR")
            return False
    
    def test_mass_mailing_features(self):
        """Test Mass Mailing & Marketing Automation features"""
        self.log("🧪 TESTING MASS MAILING FEATURES", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test local services
        results['local_health'] = self.test_endpoint("Local Mass Mailing Health", 
                                                   self.base_urls['mass_mailing'], "/health")
        results['local_docs'] = self.test_endpoint("Local Mass Mailing Docs", 
                                                 self.base_urls['mass_mailing'], "/docs")
        results['local_campaigns'] = self.test_endpoint("Local Campaigns API", 
                                                      self.base_urls['mass_mailing'], "/api/campaigns")
        
        # Test GCP services
        results['gcp_health'] = self.test_endpoint("GCP Mass Mailing Health", 
                                                 self.base_urls['gcp_mass_mailing'], "/health")
        results['gcp_docs'] = self.test_endpoint("GCP Mass Mailing Docs", 
                                               self.base_urls['gcp_mass_mailing'], "/docs")
        
        # Test A/B Testing features
        results['ab_tests'] = self.test_endpoint("A/B Testing API", 
                                               self.base_urls['mass_mailing'], "/api/ab-tests")
        
        # Test Segmentation features
        results['segmentation'] = self.test_endpoint("Segmentation API", 
                                                   self.base_urls['mass_mailing'], "/api/segmentations")
        
        # Test Automation features
        results['automation'] = self.test_endpoint("Automation API", 
                                                 self.base_urls['mass_mailing'], "/api/automation/campaigns")
        
        self.test_results['mass_mailing'] = results
        return results
    
    def test_crm_features(self):
        """Test Candidate CRM & Pipeline features"""
        self.log("🧪 TESTING CRM FEATURES", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test local services
        results['local_health'] = self.test_endpoint("Local CRM Health", 
                                                   self.base_urls['crm'], "/health")
        results['local_docs'] = self.test_endpoint("Local CRM Docs", 
                                                 self.base_urls['crm'], "/docs")
        results['local_candidates'] = self.test_endpoint("Local Candidates API", 
                                                       self.base_urls['crm'], "/api/candidate-pipelines")
        
        # Test GCP services
        results['gcp_health'] = self.test_endpoint("GCP CRM Health", 
                                                 self.base_urls['gcp_crm'], "/health")
        results['gcp_docs'] = self.test_endpoint("GCP CRM Docs", 
                                               self.base_urls['gcp_crm'], "/docs")
        
        # Test Pipeline features
        results['pipeline'] = self.test_endpoint("Pipeline API", 
                                               self.base_urls['crm'], "/api/pipeline-stages")
        
        # Test Notes and Tags
        results['notes'] = self.test_endpoint("Notes API", 
                                            self.base_urls['crm'], "/api/candidate-pipelines/test-candidate/notes")
        
        self.test_results['crm'] = results
        return results
    
    def test_milvus_features(self):
        """Test Milvus Integration & Semantic Search features"""
        self.log("🧪 TESTING MILVUS FEATURES", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test local services
        results['local_health'] = self.test_endpoint("Local Milvus Health", 
                                                   self.base_urls['milvus'], "/health")
        results['local_docs'] = self.test_endpoint("Local Milvus Docs", 
                                                 self.base_urls['milvus'], "/docs")
        
        # Test GCP services
        results['gcp_health'] = self.test_endpoint("GCP Milvus Health", 
                                                 self.base_urls['gcp_milvus'], "/health")
        
        # Test Search features
        results['semantic_search'] = self.test_endpoint("Semantic Search API", 
                                                      self.base_urls['milvus'], "/api/search/semantic")
        
        # Test Resume parsing
        results['resume_parsing'] = self.test_endpoint("Resume Parsing API", 
                                                     self.base_urls['milvus'], "/api/resume-parser/parse")
        
        # Test Gap Analysis
        results['gap_analysis'] = self.test_endpoint("Gap Analysis API", 
                                                   self.base_urls['milvus'], "/api/search/similar-resumes")
        
        self.test_results['milvus'] = results
        return results
    
    def test_frontend_connectivity(self):
        """Test Frontend connectivity"""
        self.log("🧪 TESTING FRONTEND CONNECTIVITY", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test Netlify frontend
        results['netlify'] = self.test_endpoint("Netlify Frontend", 
                                              "https://recruiter-ai-v2.netlify.app")
        
        # Test local frontend (if running)
        results['local_frontend'] = self.test_endpoint("Local Frontend", 
                                                     "http://localhost:3000")
        
        self.test_results['frontend'] = results
        return results
    
    def generate_report(self):
        """Generate comprehensive test report"""
        self.log("📊 GENERATING TEST REPORT", "INFO")
        self.log("=" * 50)
        
        total_tests = 0
        passed_tests = 0
        
        for category, results in self.test_results.items():
            self.log(f"\n📋 {category.upper()} RESULTS:")
            for test_name, result in results.items():
                total_tests += 1
                if result:
                    passed_tests += 1
                    self.log(f"  ✅ {test_name}: PASSED")
                else:
                    self.log(f"  ❌ {test_name}: FAILED")
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        self.log(f"\n🎯 OVERALL RESULTS:")
        self.log(f"  Total Tests: {total_tests}")
        self.log(f"  Passed: {passed_tests}")
        self.log(f"  Failed: {total_tests - passed_tests}")
        self.log(f"  Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            self.log("🎉 EXCELLENT! Platform is working well!", "SUCCESS")
        elif success_rate >= 60:
            self.log("⚠️ GOOD! Some issues to address", "WARNING")
        else:
            self.log("❌ NEEDS ATTENTION! Multiple issues found", "ERROR")
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'success_rate': success_rate
        }
    
    def run_all_tests(self):
        """Run all end-to-end tests"""
        self.log("🚀 STARTING COMPREHENSIVE END-TO-END TESTING", "INFO")
        self.log("=" * 60)
        self.log(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all test suites
        self.test_mass_mailing_features()
        self.test_crm_features()
        self.test_milvus_features()
        self.test_frontend_connectivity()
        
        # Generate final report
        final_results = self.generate_report()
        
        self.log("🏁 END-TO-END TESTING COMPLETED", "INFO")
        return final_results

def main():
    """Main test execution"""
    print("🧪 Recruiter.AI End-to-End Test Suite")
    print("=" * 50)
    
    tester = RecruiterAITester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if results['success_rate'] >= 60:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Failure

if __name__ == "__main__":
    main()
