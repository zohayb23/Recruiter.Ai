#!/bin/bash

# Check if service account key file exists
if [ ! -f "$1" ]; then
    echo "Please provide the path to your service account key JSON file as an argument"
    echo "Usage: ./setup-gcr-auth.sh /path/to/service-account-key.json"
    exit 1
fi

# Create Docker config JSON
echo "Creating Docker config..."
KEY_FILE=$1
KEY_DATA=$(cat $KEY_FILE | base64 -w 0)
EMAIL=$(jq -r '.client_email' $KEY_FILE)

# Create Docker config JSON
DOCKER_CONFIG="{\"auths\":{\"gcr.io\":{\"auth\":\"$KEY_DATA\",\"email\":\"$EMAIL\"}}}"

# Create Kubernetes secret
echo "Creating Kubernetes secret..."
kubectl delete secret gcr-json-key --ignore-not-found
kubectl create secret docker-registry gcr-json-key \
    --docker-server=gcr.io \
    --docker-username=_json_key \
    --docker-password="$(cat $KEY_FILE)" \
    --docker-email="$EMAIL"

echo "GCR authentication setup complete!" 