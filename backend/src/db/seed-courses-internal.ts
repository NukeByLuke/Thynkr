import prisma from './client';
import { logger } from '../lib/logger';

// Sample internal file content for AI processing
const courseFilesContent = {
  // Mathematics - Calculus
  calculus_lecture_notes: `# Calculus: Derivatives and Limits

## Introduction to Derivatives

A **derivative** represents the rate of change of a function with respect to its variable. It's the fundamental concept in differential calculus.

### Key Concepts:
- **Limit definition**: The derivative of f(x) at point a is defined as: f'(a) = lim(h→0) [f(a+h) - f(a)]/h
- **Power rule**: If f(x) = x^n, then f'(x) = nx^(n-1)
- **Chain rule**: If y = f(g(x)), then dy/dx = f'(g(x)) · g'(x)

## Common Derivatives

1. **Polynomial functions**: d/dx(x^n) = nx^(n-1)
2. **Exponential functions**: d/dx(e^x) = e^x
3. **Trigonometric functions**:
   - d/dx(sin x) = cos x
   - d/dx(cos x) = -sin x
   - d/dx(tan x) = sec^2 x

## Applications

Derivatives are used in:
- Finding maximum and minimum values
- Determining rates of change in physics (velocity, acceleration)
- Optimization problems in economics
- Curve sketching and analysis`,

  calculus_integration_guide: `# Integration Techniques

## What is Integration?

Integration is the reverse process of differentiation. It's used to find areas, volumes, and accumulations.

### Fundamental Theorem of Calculus

If F'(x) = f(x), then ∫[a to b] f(x)dx = F(b) - F(a)

## Integration Methods

### 1. Power Rule for Integration
∫x^n dx = (x^(n+1))/(n+1) + C, where n ≠ -1

### 2. Substitution Method
When you have ∫f(g(x))g'(x)dx, let u = g(x), then du = g'(x)dx

### 3. Integration by Parts
∫u dv = uv - ∫v du

## Common Integrals

- ∫e^x dx = e^x + C
- ∫(1/x) dx = ln|x| + C
- ∫sin x dx = -cos x + C
- ∫cos x dx = sin x + C

## Practice Problems

1. Find ∫(3x^2 + 2x - 1)dx
2. Evaluate ∫[0 to π] sin x dx
3. Use substitution to solve ∫2x(x^2 + 1)^3 dx`,

  calculus_limits_worksheet: `# Limits and Continuity

## Understanding Limits

A limit describes the behavior of a function as its input approaches a certain value.

### Notation
lim(x→a) f(x) = L means f(x) approaches L as x approaches a

## Limit Laws

1. **Sum rule**: lim(f + g) = lim f + lim g
2. **Product rule**: lim(f · g) = (lim f) · (lim g)
3. **Quotient rule**: lim(f/g) = (lim f)/(lim g), if lim g ≠ 0

## Types of Limits

### One-sided limits
- Right limit: lim(x→a+) f(x)
- Left limit: lim(x→a-) f(x)

### Infinite limits
lim(x→a) f(x) = ∞ means f(x) grows without bound as x approaches a

## Continuity

A function f is continuous at x = a if:
1. f(a) is defined
2. lim(x→a) f(x) exists
3. lim(x→a) f(x) = f(a)

## Examples

1. Find lim(x→2) (x^2 - 4)/(x - 2)
2. Determine if f(x) = 1/x is continuous at x = 0
3. Calculate lim(x→∞) (2x + 1)/(x - 3)`,

  // Science - Biology
  biology_cell_structure: `# Cell Structure and Function

## Introduction to Cells

Cells are the basic units of life. All living organisms are composed of one or more cells.

### Types of Cells

**Prokaryotic cells**:
- No nucleus
- DNA in nucleoid region
- Examples: Bacteria, Archaea

**Eukaryotic cells**:
- Membrane-bound nucleus
- Complex organelles
- Examples: Animals, Plants, Fungi

## Cell Organelles

### Nucleus
- Contains genetic material (DNA)
- Controls cell activities
- Site of DNA replication and transcription

### Mitochondria
- "Powerhouse of the cell"
- Produces ATP through cellular respiration
- Contains own DNA (maternal inheritance)

### Endoplasmic Reticulum (ER)
- **Rough ER**: Has ribosomes, protein synthesis
- **Smooth ER**: Lipid synthesis, detoxification

### Golgi Apparatus
- Modifies, sorts, and packages proteins
- Creates lysosomes

### Ribosomes
- Protein synthesis
- Found free in cytoplasm or attached to ER

## Cell Membrane

The **phospholipid bilayer** controls what enters and exits the cell:
- Hydrophilic heads face outward
- Hydrophobic tails face inward
- Embedded proteins facilitate transport

## Transport Mechanisms

1. **Passive transport**: No energy required
   - Diffusion
   - Osmosis
   - Facilitated diffusion

2. **Active transport**: Requires ATP
   - Sodium-potassium pump
   - Endocytosis
   - Exocytosis`,

  biology_dna_genetics: `# DNA and Genetics

## DNA Structure

**DNA (Deoxyribonucleic Acid)** is the molecule that stores genetic information.

### Structure Features:
- Double helix shape
- Two complementary strands
- Sugar-phosphate backbone
- Nitrogenous bases: A, T, G, C

### Base Pairing Rules
- Adenine (A) pairs with Thymine (T)
- Guanine (G) pairs with Cytosine (C)

## DNA Replication

The process of copying DNA:
1. **Helicase** unwinds the double helix
2. **DNA polymerase** adds complementary nucleotides
3. Two identical DNA molecules are formed

## Gene Expression

### Transcription (DNA → RNA)
- Occurs in nucleus
- RNA polymerase creates mRNA copy
- mRNA carries genetic code to ribosomes

### Translation (RNA → Protein)
- Occurs at ribosomes
- tRNA brings amino acids
- Codons specify amino acids
- Peptide bonds form proteins

## Genetics Principles

### Mendelian Genetics
- **Dominant alleles**: Expressed when present (A)
- **Recessive alleles**: Expressed only in homozygous state (a)
- **Genotype**: Genetic makeup (AA, Aa, aa)
- **Phenotype**: Observable characteristics

### Punnett Squares
Used to predict offspring genotypes:
- Cross two parents' alleles
- Calculate probability of traits

## Mutations

Changes in DNA sequence:
- **Point mutations**: Single nucleotide change
- **Insertions**: Add nucleotides
- **Deletions**: Remove nucleotides
- **Chromosomal mutations**: Large-scale changes`,

  // Technology - Programming
  programming_javascript_basics: `# JavaScript Programming Basics

## Introduction to JavaScript

JavaScript is a versatile programming language used for web development, servers, and applications.

### Variables

\`\`\`javascript
// Modern variable declarations
let age = 25;        // Can be reassigned
const name = "John"; // Cannot be reassigned
var old = 10;        // Old style, avoid using
\`\`\`

## Data Types

### Primitive Types
- **String**: \`"Hello"\`, \`'World'\`
- **Number**: \`42\`, \`3.14\`
- **Boolean**: \`true\`, \`false\`
- **Undefined**: Variable declared but not assigned
- **Null**: Intentional absence of value

### Reference Types
- **Objects**: \`{ name: "John", age: 25 }\`
- **Arrays**: \`[1, 2, 3, 4, 5]\`
- **Functions**: Reusable code blocks

## Functions

\`\`\`javascript
// Function declaration
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Arrow function
const add = (a, b) => a + b;

// Function with default parameters
function multiply(a, b = 1) {
  return a * b;
}
\`\`\`

## Control Flow

### Conditionals
\`\`\`javascript
if (age >= 18) {
  console.log("Adult");
} else {
  console.log("Minor");
}

// Ternary operator
const status = age >= 18 ? "Adult" : "Minor";
\`\`\`

### Loops
\`\`\`javascript
// For loop
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// While loop
let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}

// For...of loop
for (const item of [1, 2, 3]) {
  console.log(item);
}
\`\`\`

## Arrays and Array Methods

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

// Map: Transform each element
const doubled = numbers.map(n => n * 2);

// Filter: Keep elements that match condition
const evens = numbers.filter(n => n % 2 === 0);

// Reduce: Combine elements into single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
\`\`\`

## Objects

\`\`\`javascript
const person = {
  firstName: "John",
  lastName: "Doe",
  age: 30,
  greet() {
    return \`Hello, I'm \${this.firstName}\`;
  }
};

// Accessing properties
console.log(person.firstName);
console.log(person["lastName"]);
\`\`\``,

  programming_python_fundamentals: `# Python Programming Fundamentals

## Python Basics

Python is a high-level, interpreted language known for readability and versatility.

### Variables and Data Types

\`\`\`python
# Variables (dynamic typing)
name = "Alice"
age = 25
height = 5.7
is_student = True

# Type checking
print(type(name))  # <class 'str'>
\`\`\`

## Data Structures

### Lists
\`\`\`python
# Creating lists
fruits = ["apple", "banana", "cherry"]

# List methods
fruits.append("orange")
fruits.insert(1, "mango")
fruits.remove("banana")

# List comprehension
squares = [x**2 for x in range(10)]
\`\`\`

### Dictionaries
\`\`\`python
# Key-value pairs
person = {
    "name": "John",
    "age": 30,
    "city": "New York"
}

# Accessing values
print(person["name"])
print(person.get("age"))

# Iterating
for key, value in person.items():
    print(f"{key}: {value}")
\`\`\`

### Tuples
\`\`\`python
# Immutable sequences
coordinates = (10, 20)
x, y = coordinates  # Unpacking
\`\`\`

## Functions

\`\`\`python
# Function definition
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

# Lambda functions
square = lambda x: x ** 2

# *args and **kwargs
def sum_all(*numbers):
    return sum(numbers)

def print_info(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")
\`\`\`

## Control Flow

### Conditionals
\`\`\`python
if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")
\`\`\`

### Loops
\`\`\`python
# For loop
for i in range(5):
    print(i)

# While loop
count = 0
while count < 5:
    print(count)
    count += 1

# List iteration
for fruit in fruits:
    print(fruit)
\`\`\`

## Object-Oriented Programming

\`\`\`python
class Dog:
    def __init__(self, name, breed):
        self.name = name
        self.breed = breed
    
    def bark(self):
        return f"{self.name} says woof!"

# Creating instance
my_dog = Dog("Buddy", "Golden Retriever")
print(my_dog.bark())
\`\`\`

## File Operations

\`\`\`python
# Reading files
with open("file.txt", "r") as f:
    content = f.read()

# Writing files
with open("output.txt", "w") as f:
    f.write("Hello, World!")
\`\`\``,

  // Business - Marketing
  marketing_digital_strategies: `# Digital Marketing Strategies

## Introduction to Digital Marketing

Digital marketing encompasses all marketing efforts that use electronic devices or the internet.

### Key Channels
1. **Search Engine Marketing (SEM)**
2. **Social Media Marketing**
3. **Content Marketing**
4. **Email Marketing**
5. **Affiliate Marketing**

## SEO (Search Engine Optimization)

### On-Page SEO
- **Title tags**: Include target keywords
- **Meta descriptions**: Compelling summaries
- **Header tags**: H1, H2, H3 structure
- **Internal linking**: Connect related content
- **Image alt text**: Describe images for search engines

### Off-Page SEO
- **Backlinks**: Links from other websites
- **Social signals**: Engagement on social media
- **Brand mentions**: References across the web

## Content Marketing

### Content Types
- Blog posts
- Videos
- Infographics
- Podcasts
- Ebooks
- Webinars

### Content Strategy
1. **Define audience**: Create buyer personas
2. **Set goals**: Awareness, leads, sales
3. **Create calendar**: Plan content schedule
4. **Measure performance**: Analytics and KPIs

## Social Media Marketing

### Platform Selection
- **Facebook**: Broad audience, community building
- **Instagram**: Visual content, younger demographics
- **LinkedIn**: B2B, professional networking
- **Twitter**: Real-time engagement, news
- **TikTok**: Short videos, Gen Z audience

### Best Practices
- Consistent posting schedule
- Engage with followers
- Use hashtags strategically
- Share user-generated content
- Run contests and campaigns

## Email Marketing

### Building Lists
- Opt-in forms on website
- Lead magnets (ebooks, checklists)
- Exit-intent popups
- Social media promotions

### Email Types
- **Welcome series**: Onboard new subscribers
- **Newsletters**: Regular updates
- **Promotional**: Sales and offers
- **Transactional**: Order confirmations

### Metrics to Track
- Open rate
- Click-through rate (CTR)
- Conversion rate
- Unsubscribe rate

## Analytics and Measurement

### Key Performance Indicators (KPIs)
- Website traffic
- Bounce rate
- Time on page
- Conversion rate
- Customer acquisition cost (CAC)
- Return on investment (ROI)

### Tools
- Google Analytics
- Google Search Console
- Facebook Insights
- Mailchimp Analytics
- SEMrush or Ahrefs`,
};

async function seedCoursesWithInternalFiles() {
  try {
    logger.info('Starting comprehensive course seed with internal AI files...');

    // Get premium user
    const premiumUser = await prisma.user.findUnique({
      where: { email: 'premium@test.local' },
    });

    if (!premiumUser) {
      logger.error('Premium user not found. Run main seed first.');
      return;
    }

    // Delete existing courses
    await prisma.course.deleteMany({});
    logger.info('Cleared existing courses');

    const courses = [
      // ============ MATHEMATICS ============
      {
        title: 'Calculus Mastery',
        description: 'Complete course on derivatives, integrals, and limits with comprehensive notes and practice problems.',
        slug: 'calculus-mastery',
        category: 'MATHEMATICS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Lecture Notes: Derivatives and Limits',
            originalName: 'Derivatives_Lecture_Notes.pdf',
            fileName: 'calculus_lecture_notes.pdf',
            filePath: '/internal/calculus/lecture_notes.pdf',
            fileType: 'application/pdf',
            fileSize: 245000,
            order: 0,
            accessType: 'INTERNAL' as const,
            content: courseFilesContent.calculus_lecture_notes,
          },
          {
            name: 'Integration Techniques Guide',
            originalName: 'Integration_Guide.pdf',
            fileName: 'integration_techniques.pdf',
            filePath: '/internal/calculus/integration_guide.pdf',
            fileType: 'application/pdf',
            fileSize: 312000,
            order: 1,
            accessType: 'INTERNAL' as const,
            content: courseFilesContent.calculus_integration_guide,
          },
          {
            name: 'Limits and Continuity Worksheet',
            originalName: 'Limits_Worksheet.pdf',
            fileName: 'limits_worksheet.pdf',
            filePath: '/internal/calculus/limits_worksheet.pdf',
            fileType: 'application/pdf',
            fileSize: 198000,
            order: 2,
            accessType: 'INTERNAL' as const,
            content: courseFilesContent.calculus_limits_worksheet,
          },
        ],
      },
      // ============ SCIENCE ============
      {
        title: 'Introduction to Biology',
        description: 'Explore cell structures, DNA, genetics, and the fundamentals of life science.',
        slug: 'introduction-to-biology',
        category: 'SCIENCE' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Cell Structure and Function',
            originalName: 'Cell_Structure.pdf',
            fileName: 'cell_structure.pdf',
            filePath: '/internal/biology/cell_structure.pdf',
            fileType: 'application/pdf',
            fileSize: 352000,
            order: 0,
            accessType: 'INTERNAL' as const,
            content: courseFilesContent.biology_cell_structure,
          },
          {
            name: 'DNA and Genetics Overview',
            originalName: 'DNA_Genetics.docx',
            fileName: 'dna_genetics.docx',
            filePath: '/internal/biology/dna_genetics.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 298000,
            order: 1,
            accessType: 'INTERNAL' as const,
            content: courseFilesContent.biology_dna_genetics,
          },
        ],
      },
      // ============ TECHNOLOGY ============
      {
        title: 'Web Development Fundamentals',
        description: 'Learn JavaScript, Python, and modern programming concepts from scratch.',
        slug: 'web-development-fundamentals',
        category: 'TECHNOLOGY' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'JavaScript Basics',
            originalName: 'JavaScript_Basics.pdf',
            fileName: 'javascript_basics.pdf',
            filePath: '/internal/programming/javascript_basics.pdf',
            fileType: 'application/pdf',
            fileSize: 425000,
            order: 0,
            accessType: 'INTERNAL' as const,
            content: courseFilesContent.programming_javascript_basics,
          },
          {
            name: 'Python Fundamentals',
            originalName: 'Python_Fundamentals.txt',
            fileName: 'python_fundamentals.txt',
            filePath: '/internal/programming/python_fundamentals.txt',
            fileType: 'text/plain',
            fileSize: 389000,
            order: 1,
            accessType: 'INTERNAL' as const,
            content: courseFilesContent.programming_python_fundamentals,
          },
        ],
      },
      // ============ BUSINESS ============
      {
        title: 'Digital Marketing Essentials',
        description: 'Master SEO, content marketing, social media, and analytics for business growth.',
        slug: 'digital-marketing-essentials',
        category: 'BUSINESS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Digital Marketing Strategies',
            originalName: 'Marketing_Strategies.md',
            fileName: 'marketing_strategies.md',
            filePath: '/internal/marketing/strategies.md',
            fileType: 'text/markdown',
            fileSize: 267000,
            order: 0,
            accessType: 'INTERNAL' as const,
            content: courseFilesContent.marketing_digital_strategies,
          },
        ],
      },
    ];

    for (const courseData of courses) {
      const { files, ...courseInfo } = courseData;

      const course = await prisma.course.create({
        data: {
          ...courseInfo,
          files: {
            create: files.map(({ content, ...fileData }) => fileData),
          },
        },
        include: { files: true },
      });

      // Create AI content for each file
      for (let i = 0; i < files.length; i++) {
        const file = course.files[i];
        const fileContent = files[i].content;

        await prisma.courseFileAI.create({
          data: {
            fileId: file.id,
            extractedText: fileContent,
          },
        });
      }

      logger.info(`Created course: ${course.title} with ${files.length} internal files`);
    }

    logger.info('Course seeding completed successfully!');
  } catch (error) {
    logger.error('Error seeding courses:', error);
    throw error;
  }
}

export default seedCoursesWithInternalFiles;
