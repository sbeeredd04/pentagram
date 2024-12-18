import modal 

stub = modal.Stub("stable-diffusion-api")

image = modal.Image.debian_slim().pip_install("diffusers", "transformers", "accelrate")

with image.imports():
    import torch
    from diffusers import StableDiffusion3Pipeline
    import io
    from fastapi import Response

@stub.cls(image=image, gpu="A10G", timeout=10 * 60)
class Model:
    
    @modal.build()
    @modal.enter()
    def load_weights(self):
        self.pipe = StableDiffusion3Pipeline.from_pretrained("stabilityai/stable-diffusion-3.5-large", torch_dtype=torch.bfloat16)
        self.pipe = pipe.to("cuda")

    @modal.web_endpoint()
    def generate():
        image = pipe(
            "A capybara holding a sign that reads Hello World",
            num_inference_steps=28,
            guidance_scale=3.5,
        ).images[0]
        
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        return Response(content=buffer.getvalue(), media_type="image/jpeg")
    
