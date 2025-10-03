#!/usr/bin/env python3
"""
Final Comprehensive Test for CRM and Mass Mailing
Tests complete end-to-end workflows on both frontend and backend
"""

import requests
import json
import time
import sys
from datetime import datetime
import uuid

class FinalComprehensiveTester:
    def __init__(self):
        self.base_urls = {
            'frontend': 'http://localhost:5173',
            'local_crm': 'http://localhost:8809',
            'gcp_crm': 'http://34.31.224.102:8809',
            'local_mass_mailing': 'http://localhost:8810',
            'gcp_mass_mailing': 'http://34.31.224.102:8810',
            'local_milvus': 'http://localhost:8804',
            'gcp_milvus': 'http://34.31.224.102:8804'
        }
        self.test_results = {}
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_endpoint(self, name, url, method="GET", data=None, expected_status=200):
        """Test a single endpoint with detailed logging"""
        try:
            self.log(f"Testing {name}: {url}")
            
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=10)
            elif method == "PUT":
                response = requests.put(url, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, timeout=10)
            
            if response.status_code == expected_status:
                self.log(f"✅ {name}: SUCCESS (Status: {response.status_code})")
                return True, response.status_code
            else:
                self.log(f"⚠️ {name}: Status {response.status_code} (Expected: {expected_status})", "WARNING")
                return False, response.status_code
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ {name}: FAILED - {str(e)}", "ERROR")
            return False, 0
    
    def test_frontend_connectivity(self):
        """Test frontend connectivity and pages"""
        self.log("🧪 TESTING FRONTEND CONNECTIVITY", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test main frontend
        results['main_page'] = self.test_endpoint("Frontend Main Page", 
                                                f"{self.base_urls['frontend']}/")
        
        # Test CRM page
        results['crm_page'] = self.test_endpoint("CRM Page", 
                                               f"{self.base_urls['frontend']}/pipeline-crm")
        
        # Test Mass Mailing page
        results['mass_mailing_page'] = self.test_endpoint("Mass Mailing Page", 
                                                        f"{self.base_urls['frontend']}/mass-mailing")
        
        # Test other key pages
        results['semantic_search_page'] = self.test_endpoint("Semantic Search Page", 
                                                           f"{self.base_urls['frontend']}/semantic-search")
        
        results['gap_analysis_page'] = self.test_endpoint("Gap Analysis Page", 
                                                        f"{self.base_urls['frontend']}/gap-analysis")
        
        self.test_results['frontend'] = results
        return results
    
    def test_backend_services(self):
        """Test all backend services"""
        self.log("🧪 TESTING BACKEND SERVICES", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test Local Services
        results['local_crm_health'] = self.test_endpoint("Local CRM Health", 
                                                       f"{self.base_urls['local_crm']}/health")
        results['local_mass_mailing_health'] = self.test_endpoint("Local Mass Mailing Health", 
                                                                f"{self.base_urls['local_mass_mailing']}/health")
        results['local_milvus_health'] = self.test_endpoint("Local Milvus Health", 
                                                          f"{self.base_urls['local_milvus']}/health")
        
        # Test GCP Services
        results['gcp_crm_health'] = self.test_endpoint("GCP CRM Health", 
                                                     f"{self.base_urls['gcp_crm']}/health")
        results['gcp_mass_mailing_health'] = self.test_endpoint("GCP Mass Mailing Health", 
                                                              f"{self.base_urls['gcp_mass_mailing']}/health")
        results['gcp_milvus_health'] = self.test_endpoint("GCP Milvus Health", 
                                                        f"{self.base_urls['gcp_milvus']}/health")
        
        self.test_results['backend_services'] = results
        return results
    
    def test_crm_workflow(self):
        """Test complete CRM workflow"""
        self.log("🧪 TESTING CRM WORKFLOW", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test CRM API endpoints
        results['pipeline_stages'] = self.test_endpoint("Get Pipeline Stages", 
                                                      f"{self.base_urls['local_crm']}/api/pipeline-stages")
        results['candidate_pipelines'] = self.test_endpoint("Get Candidate Pipelines", 
                                                          f"{self.base_urls['local_crm']}/api/candidate-pipelines")
        results['pipeline_analytics'] = self.test_endpoint("Get Pipeline Analytics", 
                                                         f"{self.base_urls['local_crm']}/api/pipeline-analytics")
        
        # Test GCP CRM
        results['gcp_pipeline_stages'] = self.test_endpoint("GCP Pipeline Stages", 
                                                          f"{self.base_urls['gcp_crm']}/api/pipeline-stages")
        results['gcp_candidate_pipelines'] = self.test_endpoint("GCP Candidate Pipelines", 
                                                              f"{self.base_urls['gcp_crm']}/api/candidate-pipelines")
        
        self.test_results['crm_workflow'] = results
        return results
    
    def test_mass_mailing_workflow(self):
        """Test complete Mass Mailing workflow"""
        self.log("🧪 TESTING MASS MAILING WORKFLOW", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test Mass Mailing API endpoints
        results['campaigns'] = self.test_endpoint("Get Campaigns", 
                                                f"{self.base_urls['local_mass_mailing']}/api/campaigns")
        results['ab_tests'] = self.test_endpoint("Get A/B Tests", 
                                               f"{self.base_urls['local_mass_mailing']}/api/ab-tests")
        results['segmentations'] = self.test_endpoint("Get Segmentations", 
                                                    f"{self.base_urls['local_mass_mailing']}/api/segmentations")
        results['automation'] = self.test_endpoint("Get Automation Rules", 
                                                 f"{self.base_urls['local_mass_mailing']}/api/automation/campaigns")
        
        # Test GCP Mass Mailing
        results['gcp_campaigns'] = self.test_endpoint("GCP Campaigns", 
                                                    f"{self.base_urls['gcp_mass_mailing']}/api/campaigns")
        results['gcp_ab_tests'] = self.test_endpoint("GCP A/B Tests", 
                                                   f"{self.base_urls['gcp_mass_mailing']}/api/ab-tests")
        
        self.test_results['mass_mailing_workflow'] = results
        return results
    
    def test_milvus_workflow(self):
        """Test Milvus integration workflow"""
        self.log("🧪 TESTING MILVUS WORKFLOW", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test Milvus API endpoints
        results['stored_resumes'] = self.test_endpoint("Get Stored Resumes", 
                                                     f"{self.base_urls['local_milvus']}/api/resume-parser/stored-resumes")
        results['job_descriptions'] = self.test_endpoint("Get Job Descriptions", 
                                                       f"{self.base_urls['local_milvus']}/api/job-descriptions")
        results['candidates'] = self.test_endpoint("Get Candidates", 
                                                 f"{self.base_urls['local_milvus']}/api/candidates")
        
        # Test GCP Milvus
        results['gcp_stored_resumes'] = self.test_endpoint("GCP Stored Resumes", 
                                                         f"{self.base_urls['gcp_milvus']}/api/resume-parser/stored-resumes")
        results['gcp_job_descriptions'] = self.test_endpoint("GCP Job Descriptions", 
                                                           f"{self.base_urls['gcp_milvus']}/api/job-descriptions")
        
        self.test_results['milvus_workflow'] = results
        return results
    
    def generate_final_report(self):
        """Generate final comprehensive test report"""
        self.log("📊 GENERATING FINAL COMPREHENSIVE TEST REPORT", "INFO")
        self.log("=" * 60)
        
        total_tests = 0
        passed_tests = 0
        
        for category, category_results in self.test_results.items():
            self.log(f"\n📋 {category.upper().replace('_', ' ')} RESULTS:")
            for test_name, (passed, status_code) in category_results.items():
                total_tests += 1
                if passed:
                    passed_tests += 1
                    self.log(f"  ✅ {test_name}: PASSED (Status: {status_code})")
                else:
                    self.log(f"  ❌ {test_name}: FAILED (Status: {status_code})")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        self.log(f"\n🎯 FINAL OVERALL RESULTS:")
        self.log(f"  Total Tests: {total_tests}")
        self.log(f"  Passed: {passed_tests}")
        self.log(f"  Failed: {total_tests - passed_tests}")
        self.log(f"  Success Rate: {success_rate:.1f}%")
        
        # Detailed analysis
        self.log(f"\n📈 DETAILED ANALYSIS:")
        if success_rate >= 95:
            self.log("🎉 EXCELLENT! Platform is production-ready!", "INFO")
        elif success_rate >= 90:
            self.log("✅ VERY GOOD! Platform is highly functional", "INFO")
        elif success_rate >= 80:
            self.log("✅ GOOD! Platform is working well with minor issues", "INFO")
        elif success_rate >= 70:
            self.log("⚠️ FAIR! Platform needs some attention", "WARNING")
        else:
            self.log("❌ NEEDS ATTENTION! Multiple issues found", "ERROR")
        
        # Feature summary
        self.log(f"\n🏆 FEATURE SUMMARY:")
        frontend_success = sum(1 for passed, _ in self.test_results.get('frontend', {}).values() if passed)
        backend_success = sum(1 for passed, _ in self.test_results.get('backend_services', {}).values() if passed)
        crm_success = sum(1 for passed, _ in self.test_results.get('crm_workflow', {}).values() if passed)
        mass_mailing_success = sum(1 for passed, _ in self.test_results.get('mass_mailing_workflow', {}).values() if passed)
        milvus_success = sum(1 for passed, _ in self.test_results.get('milvus_workflow', {}).values() if passed)
        
        self.log(f"  Frontend: {frontend_success}/5 tests passed")
        self.log(f"  Backend Services: {backend_success}/6 tests passed")
        self.log(f"  CRM Workflow: {crm_success}/5 tests passed")
        self.log(f"  Mass Mailing Workflow: {mass_mailing_success}/6 tests passed")
        self.log(f"  Milvus Workflow: {milvus_success}/5 tests passed")
        
        return success_rate
    
    def run_final_test(self):
        """Run final comprehensive test"""
        self.log("🚀 STARTING FINAL COMPREHENSIVE TEST", "INFO")
        self.log("=" * 60)
        self.log(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test all components
        self.test_frontend_connectivity()
        self.test_backend_services()
        self.test_crm_workflow()
        self.test_mass_mailing_workflow()
        self.test_milvus_workflow()
        
        # Generate final report
        success_rate = self.generate_final_report()
        
        self.log("🏁 FINAL COMPREHENSIVE TEST COMPLETED")
        return success_rate

if __name__ == "__main__":
    tester = FinalComprehensiveTester()
    success_rate = tester.run_final_test()
    sys.exit(0 if success_rate >= 80 else 1)
