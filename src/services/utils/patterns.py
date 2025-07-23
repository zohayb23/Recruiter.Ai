"""Common regex patterns for information extraction"""

# Email pattern
EMAIL_PATTERN = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

# Phone pattern (handles various formats)
PHONE_PATTERN = r"""
    (?:
        (?:\+\d{1,3}[-.\s]?)?  # Optional country code
        \(?                     # Optional opening parenthesis
        \d{3}                  # Area code
        \)?[-.\s]?             # Optional closing parenthesis
        \d{3}[-.\s]?           # First 3 digits
        \d{4}                  # Last 4 digits
        (?:\s*(?:e|ext|x)\.?\s*\d{2,5})?  # Optional extension
    )
"""

# LinkedIn URL pattern
LINKEDIN_PATTERN = r"""
    (?:
        (?:https?:)?
        (?:\/\/)?
        (?:[\w]+\.)?
        linkedin\.com\/
        (?:in|pub)\/
        [\w\-\_À-ÿ%]+
    )
"""

# GitHub URL pattern
GITHUB_PATTERN = r"""
    (?:
        (?:https?:)?
        (?:\/\/)?
        (?:[\w]+\.)?
        github\.com\/
        [\w\-\_]+
    )
"""

# Website pattern
WEBSITE_PATTERN = r"""
    (?:
        (?:https?:)?
        (?:\/\/)?
        (?:www\.)?
        [a-zA-Z0-9-]+
        (?:\.[a-zA-Z]{2,})+
    )
"""

# Common date formats
DATE_PATTERNS = [
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%B %Y",
    "%b %Y",
    "%Y",
    "%m/%Y",
    "%m-%Y",
]

# Remove verbose flags from patterns
PHONE_PATTERN = PHONE_PATTERN.replace("\n", "").replace(" ", "")
LINKEDIN_PATTERN = LINKEDIN_PATTERN.replace("\n", "").replace(" ", "")
GITHUB_PATTERN = GITHUB_PATTERN.replace("\n", "").replace(" ", "")
WEBSITE_PATTERN = WEBSITE_PATTERN.replace("\n", "").replace(" ", "") 