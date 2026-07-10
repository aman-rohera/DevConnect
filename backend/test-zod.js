import { z } from 'zod';

const schema = z.object({
  body: z.object({
    companyName: z.string().min(2, "Company name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    website: z.string().url("Invalid website URL").optional().or(z.literal('')),
    industry: z.string().optional(),
    size: z.string().optional(),
    headquarters: z.string().optional(),
    description: z.string().optional(),
    logoUrl: z.string().url("Invalid logo URL").optional().or(z.literal('')),
    coverUrl: z.string().url("Invalid cover URL").optional().or(z.literal('')),
  })
});

try {
  schema.parse({
    body: {
      companyName: "Test Company",
      slug: "test-company",
      website: "",
      industry: "",
      size: "",
      headquarters: "",
      description: "",
      logoUrl: "",
      coverUrl: "",
    }
  });
  console.log("Success");
} catch (e) {
  console.log(e.errors);
}
