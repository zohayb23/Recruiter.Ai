# Understanding Kubernetes Resource Management

This guide explains the key concepts of Kubernetes resource management and the reasoning behind our specific resource allocations.

## Key Terms

### Memory Resources

1. **Memory Request (Mi/Gi)**

   - Definition: The minimum amount of memory guaranteed to a container
   - Unit explanation:
     - Mi = Mebibytes (1 Mi = 1024² bytes = 1.049 MB)
     - Gi = Gibibytes (1 Gi = 1024³ bytes = 1.074 GB)
   - Example: `512Mi` means 512 mebibytes of guaranteed memory

2. **Memory Limit (Mi/Gi)**
   - Definition: The maximum amount of memory a container can use
   - When exceeded: Container will be OOMKilled (Out Of Memory Killed)
   - Example: `1Gi` means the container will be terminated if it uses more than 1 gibibyte

### CPU Resources

1. **CPU Request (m)**

   - Definition: The guaranteed CPU resources for a container
   - Unit explanation:
     - 'm' stands for milliCPU or millicores
     - 1000m = 1 full CPU core
   - Example: `200m` means 20% of a CPU core is guaranteed

2. **CPU Limit (m)**
   - Definition: The maximum CPU resources a container can use
   - When exceeded: Container is throttled, not terminated
   - Example: `500m` means container can use up to 50% of a CPU core

## Our Resource Configurations Explained

### Base Configuration (For Lighter Components)

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "200m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

#### Why These Values?

1. **Memory Request (512Mi)**

   - Sufficient for basic application bootstrap
   - Allows multiple pods per node
   - Prevents memory starvation
   - Based on observed baseline memory usage

2. **Memory Limit (1Gi)**

   - 2x the request for handling spikes
   - Prevents single pod from consuming too much memory
   - Buffer for garbage collection cycles
   - Protection against memory leaks

3. **CPU Request (200m)**

   - Ensures responsive application under normal load
   - 20% of a CPU core is sufficient for most basic operations
   - Allows efficient pod scheduling
   - Based on average CPU utilization

4. **CPU Limit (500m)**
   - 2.5x the request for handling spikes
   - Prevents CPU throttling under normal conditions
   - Allows burst capacity for periodic tasks
   - Balances performance and resource sharing

### Resource Scaling for Different Components

1. **Light Components (e.g., Proxy)**

   - Uses base configuration
   - Primarily handles routing and lightweight operations
   - Lower resource needs due to stateless nature

2. **Medium Components (e.g., Query Node)**

   ```yaml
   resources:
     requests:
       memory: "2Gi"
       cpu: "500m"
     limits:
       memory: "4Gi"
       cpu: "1000m"
   ```

   - Higher memory for query processing
   - Full CPU core available for complex operations
   - Balanced for query performance

3. **Heavy Components (e.g., Index Node)**
   ```yaml
   resources:
     requests:
       memory: "4Gi"
       cpu: "1000m"
     limits:
       memory: "8Gi"
       cpu: "2000m"
   ```
   - Maximum resources for intensive operations
   - Handles index building and updates
   - Critical for system performance

## Best Practices

1. **Request vs Limit Ratio**

   - Memory: Generally 1:2 ratio
   - CPU: Generally 1:2 or 1:2.5 ratio
   - Allows for efficient resource utilization while preventing resource hogging

2. **Monitoring and Adjustment**

   - Use Prometheus metrics to track actual usage
   - Monitor for OOMKilled events
   - Watch for CPU throttling
   - Adjust based on real-world usage patterns

3. **Node Capacity Planning**
   - Sum of pod requests must fit within node capacity
   - Leave headroom for system processes
   - Consider node autoscaling thresholds

## Common Issues and Solutions

1. **OOMKilled Pods**

   - Symptom: Pod restarts with OOMKilled status
   - Solution: Increase memory limit or optimize application
   - Prevention: Monitor memory usage trends

2. **CPU Throttling**

   - Symptom: High CPU throttling metrics
   - Solution: Increase CPU limits or optimize processing
   - Prevention: Regular performance testing

3. **Resource Pressure**
   - Symptom: Pods pending due to insufficient resources
   - Solution: Add nodes or optimize resource requests
   - Prevention: Proper capacity planning

## Conclusion

Our resource configurations are designed to:

- Ensure stable application performance
- Maximize resource utilization
- Prevent resource contention
- Allow for scalability
- Maintain system reliability

Regular monitoring and adjustment of these values based on actual usage patterns is crucial for optimal performance.
