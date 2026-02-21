'use client';

interface ProfileImageProps {
  src?: string | null;
  alt: string;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
}

function initialsFromName(name?: string | null): string {
  if (!name) return 'U';
  const chunks = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (chunks.length === 0) return 'U';
  return chunks.map((chunk) => chunk[0]!.toUpperCase()).join('');
}

export function ProfileImage({ src, alt, name, className = 'h-10 w-10 rounded-full', fallbackClassName }: ProfileImageProps) {
  if (src && src.trim()) {
    return <img src={src} alt={alt} className={`${className} object-cover`} />;
  }

  return (
    <div
      aria-label={alt}
      className={`${className} ${fallbackClassName || 'bg-gray-200 text-gray-600'} flex items-center justify-center text-xs font-semibold`}
    >
      {initialsFromName(name)}
    </div>
  );
}
