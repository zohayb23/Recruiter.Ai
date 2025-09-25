# Pipeline CRM Backend - Production Deployment Guide

## 🚀 Overview
This guide covers deploying the Pipeline CRM Backend to Google Cloud Platform (GCP) production environment.

## 📋 Prerequisites
- GCP project: `taqforce`
- gcloud CLI installed and authenticated
- Docker installed
- Access to the project with required permissions

## 🏗️ Deployment Steps

### Step 1: Deploy Backend to Cloud Run
```bash
./deploy-production.sh
```

This script will:
- Build and push Docker image to Google Container Registry
- Deploy to Cloud Run with production configuration
- Set up health checks and auto-scaling
- Configure environment variables

### Step 2: Set up Production Database (Optional)
```bash
./setup-production-database.sh
```

This script will:
- Create Cloud SQL PostgreSQL instance
- Set up database and user
- Configure connection details
- Save credentials securely

### Step 3: Update Frontend Configuration
```bash
./update-frontend-config.sh
```

This script will:
- Update frontend environment configuration
- Point to production backend URL
- Create backup of original config

## 🔧 Configuration

### Environment Variables
- `ENVIRONMENT=production`
- `DATABASE_URL=sqlite:///tmp/pipeline_crm.db` (or PostgreSQL URL)
- `PORT=8809`

### Cloud Run Settings
- Memory: 1Gi
- CPU: 1
- Max Instances: 10
- Min Instances: 1
- Timeout: 300s
- Concurrency: 100

## 🧪 Testing

### Health Check
```bash
curl https://your-service-url/health
```

### API Documentation
Visit: `https://your-service-url/docs`

### Test Endpoints
```bash
# Get pipeline stages
curl https://your-service-url/api/pipeline-stages

# Get analytics
curl https://your-service-url/api/pipeline-analytics
```

## 📊 Monitoring

### View Logs
```bash
gcloud logs read --service=pipeline-crm-backend --region=us-central1 --limit=50
```

### Monitor Performance
- Use Cloud Run metrics in GCP Console
- Set up alerts for errors and high latency
- Monitor database performance

## 🔒 Security

### Current Security Measures
- CORS configured for production domains
- Input validation with Pydantic
- SQL injection protection with parameterized queries
- Health checks for monitoring

### Recommended Security Enhancements
- Restrict CORS to specific domains
- Implement authentication/authorization
- Use Cloud SQL with private IP
- Set up VPC and firewall rules
- Enable audit logging

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Error**
   ```bash
   gcloud auth login
   gcloud config set project taqforce
   ```

2. **Build Failure**
   - Check Docker is running
   - Verify Dockerfile syntax
   - Check requirements.txt

3. **Deployment Timeout**
   - Increase timeout in Cloud Run settings
   - Check resource limits
   - Review application startup time

4. **Database Connection Issues**
   - Verify database credentials
   - Check network connectivity
   - Review firewall rules

### Getting Help
- Check Cloud Run logs
- Review GCP Console for errors
- Test locally first
- Verify all dependencies are installed

## 📈 Scaling

### Auto-scaling
- Configured to scale 1-10 instances
- Based on CPU and request metrics
- Automatic scaling based on traffic

### Manual Scaling
```bash
gcloud run services update pipeline-crm-backend \
    --region=us-central1 \
    --min-instances=2 \
    --max-instances=20
```

## 🔄 Updates

### Deploying Updates
1. Update code
2. Run `./deploy-production.sh`
3. Test new deployment
4. Monitor for issues

### Rollback
```bash
gcloud run services update-traffic pipeline-crm-backend \
    --region=us-central1 \
    --to-revisions=REVISION_NAME=100
```

## 📝 Maintenance

### Regular Tasks
- Monitor logs for errors
- Check database performance
- Update dependencies
- Review security settings
- Backup database

### Database Maintenance
- Regular backups
- Monitor storage usage
- Optimize queries
- Update database version

## 🎯 Next Steps

1. **Custom Domain**: Set up custom domain with SSL
2. **Load Balancer**: Configure global load balancer
3. **CDN**: Set up Cloud CDN for static assets
4. **Monitoring**: Implement comprehensive monitoring
5. **CI/CD**: Set up automated deployment pipeline
6. **Security**: Implement authentication and authorization
7. **Backup**: Set up automated database backups
8. **Alerting**: Configure alerts for critical issues

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review GCP documentation
3. Check application logs
4. Test locally to isolate issues
