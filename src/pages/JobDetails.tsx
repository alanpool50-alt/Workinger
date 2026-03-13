import { Helmet } from 'react-helmet-async';

const JobSEO = ({ job }) => {
  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "identifier": {
      "@type": "PropertyValue",
      "name": job.company_name,
      "value": job.id
    },
    "datePosted": job.posted_at,
    "validThrough": "2026-12-31T23:59:59Z", // Set an expiry date
    "employmentType": job.type.toUpperCase().replace(" ", "_"), // e.g., FULL_TIME
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company_name,
      "logo": job.company_logo
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location,
        "addressCountry": job.country_code
      }
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.salary,
        "unitText": "MONTH"
      }
    }
  };

  return (
    <Helmet>
      <title>{`${job.title} at ${job.company_name} | Workinger`}</title>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
