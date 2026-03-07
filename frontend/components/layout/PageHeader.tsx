import Image from 'next/image';

interface PageHeaderProps {
  title: string;
  label: string;
  subtitle?: string;
}

export default function PageHeader({ title, label, subtitle }: PageHeaderProps) {
  return (
    <div className="bg-forest-800 py-16">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
        <Image
          src="/images/logo.png"
          alt="Hidden Ridge EDH"
          width={64}
          height={64}
          className="rounded-sm mb-4 drop-shadow-lg"
        />
        <p className="section-label text-gold-400 mb-3">{label}</p>
        <h1 className="font-serif text-4xl text-cream-100">{title}</h1>
        {subtitle && (
          <p className="text-forest-300 font-body text-sm mt-3">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
