#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#6750A4')
    draw = ImageDraw.Draw(img)
    
    # Draw a circle background
    margin = size // 8
    draw.ellipse([margin, margin, size - margin, size - margin], fill='#EADDFF')
    
    # Draw AI symbol (simple brain-like pattern)
    center = size // 2
    
    # Draw dots pattern for AI representation
    dot_size = size // 12
    positions = [
        (center - size//4, center - size//6),
        (center, center - size//4),
        (center + size//4, center - size//6),
        (center - size//5, center + size//8),
        (center + size//5, center + size//8),
        (center, center + size//4),
    ]
    
    for pos in positions:
        draw.ellipse([pos[0] - dot_size, pos[1] - dot_size, 
                     pos[0] + dot_size, pos[1] + dot_size], 
                    fill='#6750A4')
    
    # Connect dots with lines
    line_width = max(1, size // 40)
    connections = [(0, 1), (1, 2), (0, 3), (2, 4), (3, 5), (4, 5)]
    for i, j in connections:
        draw.line([positions[i], positions[j]], fill='#6750A4', width=line_width)
    
    img.save(filename)
    print(f"Created {filename}")

# Create icons in different sizes
create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')

print("All icons created successfully!")
