import React from 'react';
import imageVariants from '../generated/image-variants.json';

export default function ResponsiveImage({ src, alt, variant, ...props }) {
  const image = imageVariants[src]?.[variant];
  // New client images still work before their responsive assets are generated.
  if (!image) return <img src={src} alt={alt} {...props} />;

  const img = (
    <img
      src={src}
      srcSet={image.srcSet}
      sizes={image.sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      {...props}
    />
  );

  return image.sources.length ? (
    <picture>
      {image.sources.map(source => <source key={source.media} type="image/webp" {...source} />)}
      {img}
    </picture>
  ) : img;
}
