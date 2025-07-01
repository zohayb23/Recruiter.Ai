# Milvus Deployment on Google Kubernetes Engine (GKE)

This guide provides step-by-step instructions for deploying Milvus on Google Kubernetes Engine (GKE).

## Prerequisites

- Google Cloud SDK installed
- GCP account with billing enabled
- `kubectl` command-line tool
- Project ID: "recruiter-ai-milvus"

## 1. GKE Cluster Setup

### Create GKE Cluster

```bash
gcloud container clusters create recruiter-ai-cluster \
    --project recruiter-ai-milvus \
    --zone us-central1-a \
    --num-nodes 3 \
    --machine-type e2-standard-2 \
    --disk-size 50GB
```

### Configure kubectl

```bash
gcloud container clusters get-credentials recruiter-ai-cluster --zone us-central1-a --project recruiter-ai-milvus
```

## 2. Storage Configuration

The deployment uses standard storage classes provided by GKE. Each component (etcd, MinIO, etc.) has its own persistent volume claim.

## 3. Component Specifications

### Resource Allocations

- **etcd**:
  - Memory: 4Gi
  - CPU: 1000m
  - No restarts observed

- **MinIO**:
  - Memory: 4Gi
  - CPU: 1000m
  - No restarts observed

- **Kafka**:
  - Memory: 4Gi
  - CPU: 1000m
  - 3 restarts during initial setup (normal behavior)

- **Zookeeper**:
  - Memory: 2Gi
  - CPU: 500m
  - No restarts observed

- **Milvus Components**:
  - Data Node: 4Gi memory, 1000m CPU
  - Index Node: 4Gi memory, 1000m CPU
  - Query Node: 4Gi memory, 1000m CPU
  - Proxy: 2Gi memory, 500m CPU
  - Mix Coordinator: 2Gi memory, 500m CPU
  - 1 restart each during initial setup

## 4. Monitoring

The deployment includes:
- Prometheus for metrics collection
- Grafana for visualization
- Custom dashboards for Milvus monitoring

## 5. Verification

Check the status of all pods:
```bash
kubectl get pods
```

Expected output should show all pods in Running state with minimal restart counts.

## 6. Troubleshooting

Common issues and solutions:

1. **Pending Pods**: Usually related to insufficient resources or storage class issues
   - Solution: Check node resources and storage class configuration

2. **Component Restarts**: Some initial restarts are normal during setup
   - Kafka: Up to 3 restarts during initialization
   - Other components: 1 restart during initialization

3. **Resource Limits**: If pods are being OOMKilled
   - Adjust memory limits in the configuration
   - Monitor resource usage through Grafana

## 7. Maintenance

Regular maintenance tasks:
- Monitor resource usage through Grafana dashboards
- Check logs for any errors or warnings
- Keep GKE cluster and Milvus versions up to date
- Regular backup of critical data

## 8. Security

The deployment includes:
- Standard GKE network policies
- Default RBAC configurations
- Secure communication between components

## 9. Cost Optimization

Current setup uses:
- 3 x e2-standard-2 nodes
- 50GB disk per node
- Estimated monthly cost will vary based on usage

## 10. Next Steps

- Set up automated backups
- Configure horizontal pod autoscaling
- Implement custom monitoring alerts
- Fine-tune resource allocations based on usage patterns 