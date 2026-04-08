class CompanyDTO {
  static toPublicResponse(company) {
    if (!company) return null;
    return {
      id: company._id || company.id,
      name: company.name,
      slug: company.slug,
      country: company.country,
      city: company.city,
      employees: company.employees,
      foundingYear: company.foundingYear,
      bio: company.bio,
      pfp: company.pfp,
      banner: company.banner,
      industry: company.industry,
      languages: company.languages,
      tools: company.tools,
      workingPreference: company.workingPreference,
      areas: company.areas,
      socials: company.socials,
      isVerified: company.isVerified,
      taxNumber: company.taxNumber,
      address: company.address,
      isTaxVerified: company.isTaxVerified,
    };
  }

  static toPrivateResponse(company) {
    if (!company) return null;
    return {
      ...this.toPublicResponse(company),
      authId: company.authId,
      taxNumber: company.taxNumber,
      address: company.address,
      isTaxVerified: company.isTaxVerified,
      plan: company.plan,
      savedStudios: company.savedStudios,
      savedContents: company.savedContents,
      likedContents: company.likedContents,
    };
  }

  static toListItem(company) {
    if (!company) return null;
    return {
      id: company._id || company.id,
      name: company.name,
      slug: company.slug,
      pfp: company.pfp,
      bio: company.bio
        ? company.bio.length > 150
          ? company.bio.substring(0, 150) + "..."
          : company.bio
        : "",
      location: [company.city, company.country].filter(Boolean).join(", "),
      categories: company.areas,
      isVerified: company.isVerified,
    };
  }

  static toList(companies) {
    if (!companies) return [];
    return companies.map((company) => this.toListItem(company));
  }
}

module.exports = CompanyDTO;
