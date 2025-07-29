import os
from openai import OpenAI

# Get API key from environment variable
api_key = "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"

try:
    # Initialize the client
    client = OpenAI(api_key=api_key)
    
    # Try to make a simple API call
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Say hello!"}]
    )
    
    print("API Key is valid! Response:", response.choices[0].message.content)
except Exception as e:
    print("Error testing OpenAI API key:", str(e)) 