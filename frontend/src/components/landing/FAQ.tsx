import { Section } from './Section';

interface FAQPreviewProps {
  items: { id: string; question: string; answer: string }[];
}

export function FAQPreview({ items }: FAQPreviewProps) {
  return (
    <Section id="faq" variant="muted">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div className="md:w-1/3 space-y-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">Frequently asked questions</p>
          <h2 className="text-2xl md:text-3xl font-bold text-secondary">
            Understand exactly how RiseFlow Hub works.
          </h2>
          <p className="text-gray-600 text-sm">
            We built RiseFlow Hub to feel like a startup studio and business school in one. Here are a few common
            questions from founders and investors.
          </p>
          <a
            href="/faq"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-2"
          >
            View full FAQ →
          </a>
        </div>
        <div className="md:w-2/3 space-y-3">
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">More questions answered in the full FAQ.</p>
          ) : (
            <dl className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-3">
                  <dt className="text-sm font-semibold text-secondary">{item.question}</dt>
                  <dd className="mt-1 text-xs text-gray-700 whitespace-pre-line">{item.answer}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </Section>
  );
}

