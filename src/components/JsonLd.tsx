import type { Locale } from "@/lib/types";

type Props = {
  t: Locale;
};

export function JsonLd({ t }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t.name,
    jobTitle: t.title,
    telephone: t.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: t.location,
    },
    sameAs: [`https://t.me/${t.telegram}`],
    knowsAbout: t.skills.list.map((skill) => skill.name),
    alumniOf: {
      "@type": "Organization",
      name: t.education.university,
    },
    worksFor: {
      "@type": "Organization",
      name: t.experience[0]?.company,
    },
    hasOccupation: {
      "@type": "Occupation",
      name: t.title,
      occupationLocation: {
        "@type": "City",
        name: t.location,
      },
      skills: t.skills.list.map((skill) => skill.name),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
