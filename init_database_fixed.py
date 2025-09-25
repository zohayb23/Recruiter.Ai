def init_database():
    """Initialize the database with required tables"""
    try:
        with get_db_connection_safe() as conn:
            cursor = conn.cursor()
            
            # Campaigns table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS campaigns (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    content TEXT NOT NULL,
                    template_id TEXT,
                    status TEXT DEFAULT 'draft',
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    scheduled_at TEXT,
                    sent_at TEXT,
                    total_recipients INTEGER DEFAULT 0,
                    sent_count INTEGER DEFAULT 0,
                    delivered_count INTEGER DEFAULT 0,
                    opened_count INTEGER DEFAULT 0,
                    clicked_count INTEGER DEFAULT 0
                )
            """)
            
            # Recipients table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS recipients (
                    id TEXT PRIMARY KEY,
                    campaign_id TEXT NOT NULL,
                    candidate_id TEXT,
                    email TEXT NOT NULL,
                    name TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    sent_at TEXT,
                    delivered_at TEXT,
                    opened_at TEXT,
                    clicked_at TEXT,
                    bounce_reason TEXT,
                    FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
                )
            """)
            
            # Vendors table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS vendors (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    company TEXT,
                    phone TEXT,
                    resume_file TEXT,
                    parsed_data TEXT,
                    skills TEXT,
                    experience_level TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT
                )
            """)
            
            # Email templates table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS email_templates (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    content TEXT NOT NULL,
                    category TEXT DEFAULT 'general',
                    created_by TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT
                )
            """)
            
            # Responses table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS responses (
                    id TEXT PRIMARY KEY,
                    campaign_id TEXT NOT NULL,
                    recipient_id TEXT NOT NULL,
                    response_type TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    data TEXT,
                    FOREIGN KEY (campaign_id) REFERENCES campaigns (id),
                    FOREIGN KEY (recipient_id) REFERENCES recipients (id)
                )
            """)
            
            # Tracking pixels table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tracking_pixels (
                    id TEXT PRIMARY KEY,
                    campaign_id TEXT NOT NULL,
                    recipient_id TEXT NOT NULL,
                    pixel_id TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            
            # Webhook events table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS webhook_events (
                    id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    campaign_id TEXT,
                    recipient_id TEXT,
                    timestamp TEXT NOT NULL,
                    event_data TEXT NOT NULL,
                    processed_at TEXT
                )
            """)
            
            # A/B Tests table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ab_tests (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    campaign_id TEXT NOT NULL,
                    status TEXT DEFAULT 'draft',
                    winner_variant_id TEXT,
                    confidence_score REAL,
                    created_at TEXT NOT NULL,
                    started_at TEXT,
                    completed_at TEXT
                )
            """)
            
            # A/B Test Variants table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ab_test_variants (
                    id TEXT PRIMARY KEY,
                    ab_test_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    content TEXT NOT NULL,
                    send_percentage REAL NOT NULL,
                    total_sent INTEGER DEFAULT 0,
                    delivered INTEGER DEFAULT 0,
                    opened INTEGER DEFAULT 0,
                    clicked INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (ab_test_id) REFERENCES ab_tests (id)
                )
            """)
            
            # A/B Test Recipients table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ab_test_recipients (
                    id TEXT PRIMARY KEY,
                    ab_test_id TEXT NOT NULL,
                    variant_id TEXT NOT NULL,
                    recipient_id TEXT NOT NULL,
                    assigned_at TEXT NOT NULL,
                    FOREIGN KEY (ab_test_id) REFERENCES ab_tests (id),
                    FOREIGN KEY (variant_id) REFERENCES ab_test_variants (id),
                    FOREIGN KEY (recipient_id) REFERENCES recipients (id)
                )
            """)
            
            # Recipient Profiles table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS recipient_profiles (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT,
                    company TEXT,
                    title TEXT,
                    experience_years INTEGER,
                    skills TEXT,
                    location TEXT,
                    industry TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT
                )
            """)
            
            # Segmentations table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS segmentations (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    rules TEXT NOT NULL,
                    logical_operator TEXT DEFAULT 'AND',
                    created_at TEXT NOT NULL,
                    updated_at TEXT
                )
            """)
            
            # Segmentation Results table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS segmentation_results (
                    id TEXT PRIMARY KEY,
                    segmentation_id TEXT NOT NULL,
                    recipient_id TEXT NOT NULL,
                    matched_at TEXT NOT NULL,
                    FOREIGN KEY (segmentation_id) REFERENCES segmentations (id),
                    FOREIGN KEY (recipient_id) REFERENCES recipient_profiles (id)
                )
            """)
            
            # Automation Campaigns table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS automation_campaigns (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    status TEXT DEFAULT 'active',
                    created_at TEXT NOT NULL,
                    updated_at TEXT
                )
            """)
            
            # Automation Rules table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS automation_rules (
                    id TEXT PRIMARY KEY,
                    campaign_id TEXT NOT NULL,
                    trigger_type TEXT NOT NULL,
                    trigger_conditions TEXT NOT NULL,
                    actions TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (campaign_id) REFERENCES automation_campaigns (id)
                )
            """)
            
            # Automation Executions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS automation_executions (
                    id TEXT PRIMARY KEY,
                    campaign_id TEXT NOT NULL,
                    rule_id TEXT NOT NULL,
                    recipient_id TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    executed_at TEXT,
                    result TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (campaign_id) REFERENCES automation_campaigns (id),
                    FOREIGN KEY (rule_id) REFERENCES automation_rules (id)
                )
            """)
            
            # Automation Templates table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS automation_templates (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    template_data TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """)
            
            print("✅ Mass mailing database initialized successfully")
            
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        raise e
