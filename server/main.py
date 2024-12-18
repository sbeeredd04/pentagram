import io
import modal
import time
from pathlib import Path
import random

# Define constants
MINUTES = 60

# Import dependencies
from huggingface_hub import login
login(token='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')

# Create Modal app
app = modal.App("simple-text-to-image")

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
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})  # faster downloads
)

with image.imports():
    import diffusers
    import torch
    from fastapi import Response
    from diffusers import StableDiffusion3Pipeline

model_id = "stabilityai/stable-diffusion-3.5-large"

@app.cls(
    image=image,
    gpu="A100",
    timeout=10 * MINUTES,
)
class Inference:
    @modal.build()
    @modal.enter()
    def initialize(self):
        self.pipe = diffusers.StableDiffusion3Pipeline.from_pretrained(
            model_id,
            torch_dtype=torch.bfloat16,
        )

    @modal.enter()
    def move_to_gpu(self):
        self.pipe.to("cuda")

    @modal.method()
    def run( self, prompt: str, batch_size: int = 1, seed: int = None ) -> list[bytes]:
        
        seed = seed if seed is not None else random.randint(0, 2**32 - 1)
        print("seeding RNG with", seed)
        torch.manual_seed(seed)

        images = self.pipe(
            prompt,
            num_images_per_prompt=batch_size,
            num_inference_steps=28,  
            guidance_scale=3.5, 
        ).images

        image_output = []
        for image in images:
            with io.BytesIO() as buf:
                image.save(buf, format="PNG")
                image_output.append(buf.getvalue())
        torch.cuda.empty_cache()  # reduce fragmentation
        return image_output

    @modal.web_endpoint(docs=True)
    def web(self, prompt="A beautiful ocean with a sunset and a cute racoon", seed: int = None):
        return Response(
            content=self.run.local(  # run in the same container
                prompt, batch_size=1, seed=seed
            )[0],
            media_type="image/png",
        )
