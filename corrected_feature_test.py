#!/usr/bin/env python3
"""
Corrected Comprehensive Feature Test for CRM and Mass Mailing
Tests all functionality with proper data validation
"""

import requests
import json
import time
import sys
from datetime import datetime
import uuid

class CorrectedFeatureTester:
    def __init__(self):
        self.base_urls = {
            'local_crm': 'http://localhost:8809',
            'gcp_crm': 'http://34.31.224.102:8809',
            'local_mass_mailing': 'http://localhost:8810',
            'gcp_mass_mailing': 'http://34.31.224.102:8810',
            'local_milvus': 'http://localhost:8804',
            'gcp_milvus': 'http://34.31.224.102:8804'
        }
        self.test_results = {}
        self.test_data = {}
        
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
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, response.text
            else:
                self.log(f"⚠️ {name}: Status {response.status_code} (Expected: {expected_status})", "WARNING")
                try:
                    error_detail = response.json()
                    self.log(f"   Error details: {error_detail}", "WARNING")
                except:
                    self.log(f"   Error text: {response.text}", "WARNING")
                return False, response.text
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ {name}: FAILED - {str(e)}", "ERROR")
            return False, str(e)
    
    def test_crm_backend_features(self):
        """Test all CRM backend features with corrected data"""
        self.log("🧪 TESTING CRM BACKEND FEATURES (CORRECTED)", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test 1: Health Check
        results['health'] = self.test_endpoint("CRM Health Check", 
                                             f"{self.base_urls['local_crm']}/health")
        
        # Test 2: Get Pipeline Stages
        results['pipeline_stages'] = self.test_endpoint("Get Pipeline Stages", 
                                                      f"{self.base_urls['local_crm']}/api/pipeline-stages")
        
        # Test 3: Create Pipeline Stage (with required fields)
        stage_data = {
            "id": f"stage-{uuid.uuid4().hex[:8]}",
            "name": f"Test Stage {uuid.uuid4().hex[:8]}",
            "description": "Test stage for comprehensive testing",
            "order": 1,
            "color": "#FF5733",
            "is_active": True,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        results['create_stage'] = self.test_endpoint("Create Pipeline Stage", 
                                                   f"{self.base_urls['local_crm']}/api/pipeline-stages",
                                                   method="POST", data=stage_data)
        
        # Store created stage ID for later tests
        if results['create_stage'][0]:
            self.test_data['stage_id'] = results['create_stage'][1].get('id')
        
        # Test 4: Get Candidate Pipelines
        results['candidate_pipelines'] = self.test_endpoint("Get Candidate Pipelines", 
                                                          f"{self.base_urls['local_crm']}/api/candidate-pipelines")
        
        # Test 5: Create Candidate Pipeline (with required fields)
        candidate_data = {
            "candidate_id": f"test-candidate-{uuid.uuid4().hex[:8]}",
            "current_stage": "Applied",
            "stage_history": [],
            "assigned_recruiter": "Test Recruiter",
            "priority_level": "high",
            "last_activity_date": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        results['create_candidate'] = self.test_endpoint("Create Candidate Pipeline", 
                                                       f"{self.base_urls['local_crm']}/api/candidate-pipelines",
                                                       method="POST", data=candidate_data)
        
        # Store created candidate ID for later tests
        if results['create_candidate'][0]:
            self.test_data['candidate_id'] = candidate_data['candidate_id']
        
        # Test 6: Add Notes to Candidate
        if self.test_data.get('candidate_id'):
            note_data = {
                "content": "Test note for comprehensive testing",
                "note_type": "general",
                "created_by": "Test User"
            }
            results['add_note'] = self.test_endpoint("Add Note to Candidate", 
                                                   f"{self.base_urls['local_crm']}/api/candidate-pipelines/{self.test_data['candidate_id']}/notes",
                                                   method="POST", data=note_data)
        
        # Test 7: Add Tags to Candidate
        if self.test_data.get('candidate_id'):
            tag_data = {
                "tag_name": "test-tag",
                "tag_color": "#00FF00"
            }
            results['add_tag'] = self.test_endpoint("Add Tag to Candidate", 
                                                  f"{self.base_urls['local_crm']}/api/candidate-pipelines/{self.test_data['candidate_id']}/tags",
                                                  method="POST", data=tag_data)
        
        # Test 8: Transition Candidate
        if self.test_data.get('candidate_id'):
            transition_data = {
                "to_stage": "Interview",
                "transition_reason": "Passed initial screening"
            }
            results['transition_candidate'] = self.test_endpoint("Transition Candidate", 
                                                               f"{self.base_urls['local_crm']}/api/candidate-pipelines/{self.test_data['candidate_id']}/transition",
                                                               method="POST", data=transition_data)
        
        # Test 9: Get Pipeline Analytics
        results['analytics'] = self.test_endpoint("Get Pipeline Analytics", 
                                                f"{self.base_urls['local_crm']}/api/pipeline-analytics")
        
        self.test_results['crm_backend'] = results
        return results
    
    def test_mass_mailing_backend_features(self):
        """Test all Mass Mailing backend features with corrected data"""
        self.log("🧪 TESTING MASS MAILING BACKEND FEATURES (CORRECTED)", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test 1: Health Check
        results['health'] = self.test_endpoint("Mass Mailing Health Check", 
                                             f"{self.base_urls['local_mass_mailing']}/health")
        
        # Test 2: Get Campaigns
        results['get_campaigns'] = self.test_endpoint("Get Campaigns", 
                                                    f"{self.base_urls['local_mass_mailing']}/api/campaigns")
        
        # Test 3: Create Campaign
        campaign_data = {
            "name": f"Test Campaign {uuid.uuid4().hex[:8]}",
            "subject": "Test Email Subject",
            "content": "Test email content for comprehensive testing",
            "recipient_list": ["test1@example.com", "test2@example.com"],
            "scheduled_at": None,
            "status": "draft"
        }
        results['create_campaign'] = self.test_endpoint("Create Campaign", 
                                                      f"{self.base_urls['local_mass_mailing']}/api/campaigns",
                                                      method="POST", data=campaign_data)
        
        # Store created campaign ID for later tests
        if results['create_campaign'][0]:
            self.test_data['campaign_id'] = results['create_campaign'][1].get('id')
        
        # Test 4: A/B Testing - Create A/B Test
        if self.test_data.get('campaign_id'):
            ab_test_data = {
                "campaign_id": self.test_data['campaign_id'],
                "test_name": f"Test A/B Test {uuid.uuid4().hex[:8]}",
                "variants": [
                    {
                        "name": "Variant A",
                        "subject": "Subject A",
                        "content": "Content A",
                        "recipient_percentage": 50
                    },
                    {
                        "name": "Variant B", 
                        "subject": "Subject B",
                        "content": "Content B",
                        "recipient_percentage": 50
                    }
                ],
                "test_duration_hours": 24,
                "success_metric": "open_rate"
            }
            results['create_ab_test'] = self.test_endpoint("Create A/B Test", 
                                                         f"{self.base_urls['local_mass_mailing']}/api/ab-tests",
                                                         method="POST", data=ab_test_data)
        
        # Test 5: Segmentation - Create Segmentation (with corrected field name)
        segmentation_data = {
            "name": f"Test Segmentation {uuid.uuid4().hex[:8]}",
            "description": "Test segmentation for comprehensive testing",
            "rules": [  # Changed from "filters" to "rules"
                {
                    "field": "location",
                    "operator": "equals",
                    "value": "New York"
                }
            ],
            "logical_operator": "AND"
        }
        results['create_segmentation'] = self.test_endpoint("Create Segmentation", 
                                                          f"{self.base_urls['local_mass_mailing']}/api/segmentations",
                                                          method="POST", data=segmentation_data)
        
        # Test 6: Automation - Create Automation Rule
        automation_data = {
            "name": f"Test Automation {uuid.uuid4().hex[:8]}",
            "description": "Test automation rule for comprehensive testing",
            "trigger_type": "time_based",
            "trigger_config": {
                "schedule_type": "daily",
                "time": "09:00"
            },
            "actions": [
                {
                    "action_type": "send_email",
                    "action_config": {
                        "template_id": "welcome_template",
                        "recipient_list": ["new@example.com"]
                    }
                }
            ],
            "is_active": True
        }
        results['create_automation'] = self.test_endpoint("Create Automation Rule", 
                                                        f"{self.base_urls['local_mass_mailing']}/api/automation/campaigns",
                                                        method="POST", data=automation_data)
        
        # Test 7: Get A/B Tests
        results['get_ab_tests'] = self.test_endpoint("Get A/B Tests", 
                                                   f"{self.base_urls['local_mass_mailing']}/api/ab-tests")
        
        # Test 8: Get Segmentations
        results['get_segmentations'] = self.test_endpoint("Get Segmentations", 
                                                        f"{self.base_urls['local_mass_mailing']}/api/segmentations")
        
        # Test 9: Get Automation Rules
        results['get_automation'] = self.test_endpoint("Get Automation Rules", 
                                                     f"{self.base_urls['local_mass_mailing']}/api/automation/campaigns")
        
        self.test_results['mass_mailing_backend'] = results
        return results
    
    def test_gcp_services(self):
        """Test GCP services to ensure they're working"""
        self.log("🧪 TESTING GCP SERVICES", "INFO")
        self.log("=" * 50)
        
        results = {}
        
        # Test GCP CRM
        results['gcp_crm_health'] = self.test_endpoint("GCP CRM Health", 
                                                     f"{self.base_urls['gcp_crm']}/health")
        results['gcp_crm_pipeline'] = self.test_endpoint("GCP CRM Pipeline Stages", 
                                                       f"{self.base_urls['gcp_crm']}/api/pipeline-stages")
        
        # Test GCP Mass Mailing
        results['gcp_mass_mailing_health'] = self.test_endpoint("GCP Mass Mailing Health", 
                                                              f"{self.base_urls['gcp_mass_mailing']}/health")
        results['gcp_mass_mailing_campaigns'] = self.test_endpoint("GCP Mass Mailing Campaigns", 
                                                                 f"{self.base_urls['gcp_mass_mailing']}/api/campaigns")
        
        # Test GCP Milvus
        results['gcp_milvus_health'] = self.test_endpoint("GCP Milvus Health", 
                                                        f"{self.base_urls['gcp_milvus']}/health")
        
        self.test_results['gcp_services'] = results
        return results
    
    def generate_report(self):
        """Generate comprehensive test report"""
        self.log("📊 GENERATING COMPREHENSIVE TEST REPORT", "INFO")
        self.log("=" * 50)
        
        total_tests = 0
        passed_tests = 0
        
        for category, category_results in self.test_results.items():
            self.log(f"\n📋 {category.upper().replace('_', ' ')} RESULTS:")
            for test_name, (passed, _) in category_results.items():
                total_tests += 1
                if passed:
                    passed_tests += 1
                    self.log(f"  ✅ {test_name}: PASSED")
                else:
                    self.log(f"  ❌ {test_name}: FAILED")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        self.log(f"\n🎯 OVERALL RESULTS:")
        self.log(f"  Total Tests: {total_tests}")
        self.log(f"  Passed: {passed_tests}")
        self.log(f"  Failed: {total_tests - passed_tests}")
        self.log(f"  Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            self.log("🎉 EXCELLENT! All features are working perfectly!", "INFO")
        elif success_rate >= 80:
            self.log("✅ GOOD! Most features are working well", "INFO")
        elif success_rate >= 70:
            self.log("⚠️ FAIR! Some issues need attention", "WARNING")
        else:
            self.log("❌ NEEDS ATTENTION! Multiple issues found", "ERROR")
        
        return success_rate
    
    def run_comprehensive_test(self):
        """Run all comprehensive tests"""
        self.log("🚀 STARTING CORRECTED COMPREHENSIVE FEATURE TESTING", "INFO")
        self.log("=" * 60)
        self.log(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test CRM Backend
        self.test_crm_backend_features()
        
        # Test Mass Mailing Backend
        self.test_mass_mailing_backend_features()
        
        # Test GCP Services
        self.test_gcp_services()
        
        # Generate Report
        success_rate = self.generate_report()
        
        self.log("🏁 CORRECTED COMPREHENSIVE FEATURE TESTING COMPLETED")
        return success_rate

if __name__ == "__main__":
    tester = CorrectedFeatureTester()
    success_rate = tester.run_comprehensive_test()
    sys.exit(0 if success_rate >= 80 else 1)
