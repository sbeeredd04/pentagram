import io
import base64
import modal
import time
import random
from pathlib import Path
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from huggingface_hub import login

# Define constants
MINUTES = 60

# Login to HuggingFace
login(token='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')

# Predefine the model ID
model_id = "stabilityai/stable-diffusion-3.5-large"

# Named function to pre-download the model during the build phase
def download_model():
    from diffusers import StableDiffusion3Pipeline
    import torch
    StableDiffusion3Pipeline.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,  # Corrected the dtype
    ).save_pretrained("/model")

# Build the Modal app and pre-download the model during the build phase
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "accelerate==0.33.0",
        "diffusers==0.31.0",
        "fastapi[standard]==0.115.4",
        "huggingface-hub[hf_transfer]==0.25.2",
        "sentencepiece==0.2.0",
        "torch==2.5.1",
        "torchvision==0.20.1",
        "transformers~=4.44.0",
    )
    .run_function(download_model)
)

app = modal.App("simple-text-to-image")

@app.cls(
    image=image,
    gpu="A100",
    timeout=10 * MINUTES,
    keep_warm=1  # Keep at least 1 container warm to reduce cold starts
)
class Inference:
    @modal.enter()
    def initialize(self):
        # Load the pre-saved model from the build phase
        from diffusers import StableDiffusion3Pipeline
        import torch
        print("Initializing model...")
        self.pipe = StableDiffusion3Pipeline.from_pretrained(
            "/model",
            torch_dtype=torch.bfloat16,  # Corrected the dtype
        )
        self.pipe.to("cuda")
        print("Model loaded onto GPU.")

    @modal.method()
    def run(self, prompt: str, batch_size: int = 1) -> bytes:
        import torch
        
        # Generate images
        images = self.pipe(
            prompt,
            num_images_per_prompt=batch_size,
            num_inference_steps=16,  # Reduced for faster response
            guidance_scale=3.5,  # Balanced guidance scale
        ).images

        # Convert the first image to PNG format and encode it as Base64
        with io.BytesIO() as buf:
            images[0].save(buf, format="PNG")
            return base64.b64encode(buf.getvalue()).decode("utf-8")

    @modal.web_endpoint(method="POST", docs=True)
    async def web(self, request: Request):
        # Parse the JSON payload for the prompt
        data = await request.json()
        prompt = data.get("text")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        # Generate the image and return it as Base64-encoded data
        image_base64 = self.run.local(prompt, batch_size=1)
        return JSONResponse(content={"image": image_base64})

# Dynamic scaling of warm containers based on traffic
@app.function(schedule=modal.Cron("0 * * * *"))
def adjust_keep_warm():
    from datetime import datetime, timezone

    # Define peak hours
    peak_hours_start, peak_hours_end = 6, 18
    current_hour = datetime.now(timezone.utc).hour
    if peak_hours_start <= current_hour < peak_hours_end:
        Inference.keep_warm(2)  # Keep more containers warm during peak hours
    else:
        Inference.keep_warm(1)  # Fewer containers during off-peak hours
