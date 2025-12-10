import bcrypt from 'bcryptjs';
import prisma from './client';
import { logger } from '../lib/logger';

/**
 * Clean seed script for Thynkr
 * Creates realistic demo data for the new academic UI
 */

// ============ SAMPLE USERS ============

const sampleUsers = [
  {
    email: 'admin@thynkr.edu',
    username: 'admin',
    password: 'AdminPass123!',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    role: 'ADMIN' as const,
    emailVerified: true,
    theme: 'dark',
  },
  {
    email: 'teacher@thynkr.edu',
    username: 'prof_chen',
    password: 'TeacherPass123!',
    firstName: 'David',
    lastName: 'Chen',
    role: 'PREMIUM' as const,
    emailVerified: true,
    theme: 'light',
  },
  {
    email: 'student@thynkr.edu',
    username: 'alex_student',
    password: 'StudentPass123!',
    firstName: 'Alex',
    lastName: 'Rivera',
    role: 'STANDARD' as const,
    emailVerified: true,
    theme: 'dark',
  },
  {
    email: 'demo@thynkr.edu',
    username: 'demo_user',
    password: 'DemoPass123!',
    firstName: 'Jordan',
    lastName: 'Taylor',
    role: 'BASIC' as const,
    emailVerified: true,
    theme: 'light',
  },
];

// ============ SAMPLE COURSES ============

interface CourseData {
  title: string;
  description: string;
  slug: string;
  category: 'MATHEMATICS' | 'SCIENCE' | 'TECHNOLOGY' | 'HUMANITIES' | 'LANGUAGES' | 'BUSINESS' | 'OTHER';
  visibility: 'PUBLIC' | 'PRIVATE';
  published: boolean;
  files: CourseFileData[];
}

interface CourseFileData {
  name: string;
  originalName: string;
  fileType: string;
  content: string;
}

const sampleCourses: CourseData[] = [
  {
    title: 'Web Development Fundamentals',
    description: 'A comprehensive introduction to modern web development. Learn HTML, CSS, JavaScript, and responsive design principles that form the foundation of every website.',
    slug: 'web-development-fundamentals',
    category: 'TECHNOLOGY',
    visibility: 'PUBLIC',
    published: true,
    files: [
      {
        name: 'HTML Basics',
        originalName: 'html-basics.md',
        fileType: 'text/markdown',
        content: `# HTML Fundamentals

## What is HTML?

HTML (HyperText Markup Language) is the standard language for creating web pages. It describes the structure of a webpage using markup.

## Basic Structure

Every HTML document follows this structure:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Page Title</title>
</head>
<body>
    <h1>Welcome</h1>
    <p>This is a paragraph.</p>
</body>
</html>
\`\`\`

## Essential Elements

### Headings
HTML provides six levels of headings (h1-h6):
- \`<h1>\` - Main heading (use once per page)
- \`<h2>\` - Section headings
- \`<h3>\` to \`<h6>\` - Subsections

### Text Elements
- \`<p>\` - Paragraphs
- \`<strong>\` - Bold/important text
- \`<em>\` - Italic/emphasized text
- \`<br>\` - Line break
- \`<hr>\` - Horizontal rule

### Links and Images
- \`<a href="url">\` - Hyperlinks
- \`<img src="path" alt="description">\` - Images

### Lists
- \`<ul>\` - Unordered (bullet) list
- \`<ol>\` - Ordered (numbered) list
- \`<li>\` - List item

## Semantic HTML5

Modern HTML uses semantic elements for better structure:
- \`<header>\` - Page or section header
- \`<nav>\` - Navigation links
- \`<main>\` - Main content
- \`<article>\` - Self-contained content
- \`<section>\` - Thematic grouping
- \`<aside>\` - Sidebar content
- \`<footer>\` - Page or section footer

## Best Practices

1. Always use lowercase for element names
2. Close all elements properly
3. Use meaningful alt text for images
4. Indent nested elements for readability
5. Validate your HTML using W3C validator`,
      },
      {
        name: 'CSS Styling Guide',
        originalName: 'css-styling.md',
        fileType: 'text/markdown',
        content: `# CSS Styling Guide

## Introduction to CSS

CSS (Cascading Style Sheets) controls the visual presentation of HTML elements. It separates content from design.

## CSS Syntax

\`\`\`css
selector {
    property: value;
}
\`\`\`

Example:
\`\`\`css
h1 {
    color: #333;
    font-size: 2rem;
}
\`\`\`

## Selectors

### Basic Selectors
- Element: \`p { }\`
- Class: \`.classname { }\`
- ID: \`#idname { }\`
- Universal: \`* { }\`

### Combinators
- Descendant: \`div p { }\`
- Child: \`div > p { }\`
- Sibling: \`h1 + p { }\`

## The Box Model

Every element is a box with:
- **Content** - The actual content
- **Padding** - Space inside the border
- **Border** - The edge of the element
- **Margin** - Space outside the border

\`\`\`css
.box {
    width: 300px;
    padding: 20px;
    border: 1px solid #ccc;
    margin: 10px;
}
\`\`\`

## Layout with Flexbox

Flexbox makes responsive layouts easy:

\`\`\`css
.container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}
\`\`\`

## CSS Grid

For two-dimensional layouts:

\`\`\`css
.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}
\`\`\`

## Responsive Design

Use media queries to adapt to different screen sizes:

\`\`\`css
@media (max-width: 768px) {
    .container {
        flex-direction: column;
    }
}
\`\`\`

## Modern CSS Features

- CSS Variables: \`--primary-color: #3b82f6;\`
- Transitions: \`transition: all 0.3s ease;\`
- Transforms: \`transform: scale(1.1);\`
- Animations: \`@keyframes fadeIn { ... }\``,
      },
      {
        name: 'JavaScript Essentials',
        originalName: 'javascript-essentials.md',
        fileType: 'text/markdown',
        content: `# JavaScript Essentials

## What is JavaScript?

JavaScript is a programming language that brings interactivity to web pages. It runs in the browser and can manipulate HTML and CSS dynamically.

## Variables

Modern JavaScript uses \`let\` and \`const\`:

\`\`\`javascript
const name = 'Thynkr';  // Cannot be reassigned
let count = 0;          // Can be reassigned
\`\`\`

## Data Types

- **String**: \`"Hello"\` or \`'World'\`
- **Number**: \`42\` or \`3.14\`
- **Boolean**: \`true\` or \`false\`
- **Array**: \`[1, 2, 3]\`
- **Object**: \`{ name: 'Alex', age: 22 }\`
- **Null**: \`null\`
- **Undefined**: \`undefined\`

## Functions

\`\`\`javascript
// Function declaration
function greet(name) {
    return \`Hello, \${name}!\`;
}

// Arrow function
const add = (a, b) => a + b;
\`\`\`

## DOM Manipulation

\`\`\`javascript
// Select elements
const button = document.querySelector('.btn');

// Add event listener
button.addEventListener('click', () => {
    console.log('Button clicked!');
});

// Modify content
document.getElementById('title').textContent = 'New Title';
\`\`\`

## Arrays and Methods

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];

// Map - transform each element
const doubled = numbers.map(n => n * 2);

// Filter - keep elements that pass test
const evens = numbers.filter(n => n % 2 === 0);

// Reduce - combine into single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
\`\`\`

## Async/Await

\`\`\`javascript
async function fetchData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}
\`\`\`

## ES6+ Features

- Template literals: \`\`Hello, \${name}\`\`
- Destructuring: \`const { a, b } = obj\`
- Spread operator: \`[...arr1, ...arr2]\`
- Optional chaining: \`obj?.property\`
- Nullish coalescing: \`value ?? 'default'\``,
      },
    ],
  },
  {
    title: 'Psychology 101',
    description: 'An introduction to the science of mind and behavior. Explore fundamental psychological concepts, research methods, and the major perspectives that shape our understanding of human nature.',
    slug: 'psychology-101',
    category: 'HUMANITIES',
    visibility: 'PUBLIC',
    published: true,
    files: [
      {
        name: 'Introduction to Psychology',
        originalName: 'intro-psychology.md',
        fileType: 'text/markdown',
        content: `# Introduction to Psychology

## What is Psychology?

Psychology is the scientific study of mind and behavior. It explores how people think, feel, and act—both individually and in groups.

## Historical Perspectives

### Structuralism (Wilhelm Wundt)
- Founded first psychology lab in 1879
- Studied the structure of consciousness
- Used introspection as primary method

### Functionalism (William James)
- Focused on the purpose of mental processes
- Influenced by Darwin's evolutionary theory
- Asked "What is the function of thought?"

### Psychoanalysis (Sigmund Freud)
- Emphasized unconscious processes
- Developed theory of personality (id, ego, superego)
- Introduced dream analysis and free association

## Modern Perspectives

### Biological Perspective
Studies the physical basis of behavior:
- Brain structures and neurotransmitters
- Genetics and heredity
- Hormonal influences

### Cognitive Perspective
Examines mental processes:
- Memory, attention, perception
- Problem-solving and decision-making
- Language and thinking

### Behavioral Perspective
Focuses on observable behavior:
- Classical conditioning (Pavlov)
- Operant conditioning (Skinner)
- Environmental influences

### Humanistic Perspective
Emphasizes human potential:
- Self-actualization (Maslow)
- Client-centered therapy (Rogers)
- Free will and personal growth

## Research Methods

1. **Experiments** - Establish cause and effect
2. **Correlational studies** - Find relationships
3. **Case studies** - In-depth individual analysis
4. **Surveys** - Gather large-scale data
5. **Naturalistic observation** - Study behavior in context

## Ethics in Psychology

- Informed consent
- Confidentiality
- Right to withdraw
- Debriefing
- Protection from harm`,
      },
      {
        name: 'Memory and Learning',
        originalName: 'memory-learning.md',
        fileType: 'text/markdown',
        content: `# Memory and Learning

## How Memory Works

Memory is the process of encoding, storing, and retrieving information.

## Types of Memory

### Sensory Memory
- Very brief (milliseconds to seconds)
- Iconic (visual) and echoic (auditory)
- Acts as a buffer for stimuli

### Short-Term Memory (STM)
- Duration: 15-30 seconds without rehearsal
- Capacity: 7 ± 2 items (Miller's Law)
- Working memory is an active form of STM

### Long-Term Memory (LTM)
- Potentially unlimited capacity
- Can last a lifetime
- Requires encoding from STM

## Long-Term Memory Types

**Explicit (Declarative)**
- Episodic: Personal experiences and events
- Semantic: Facts and general knowledge

**Implicit (Non-declarative)**
- Procedural: Skills and habits
- Classical conditioning: Learned associations

## Memory Processes

### Encoding
Converting information into a form the brain can store:
- Visual encoding (images)
- Acoustic encoding (sounds)
- Semantic encoding (meaning) - most effective

### Storage
Maintaining encoded information:
- Consolidation strengthens memories
- Sleep plays a crucial role
- Emotional memories are stronger

### Retrieval
Accessing stored information:
- Recall: Generating information
- Recognition: Identifying information
- Context-dependent: Easier in same environment

## Why We Forget

1. **Decay** - Memory traces fade over time
2. **Interference** - Other memories compete
   - Proactive: Old interferes with new
   - Retroactive: New interferes with old
3. **Retrieval failure** - Encoding specificity
4. **Motivated forgetting** - Repression

## Improving Memory

- **Elaborative rehearsal** - Connect to existing knowledge
- **Chunking** - Group information
- **Mnemonics** - Memory aids (acronyms, method of loci)
- **Spaced practice** - Distribute learning over time
- **Testing effect** - Retrieval practice strengthens memory`,
      },
      {
        name: 'Social Psychology',
        originalName: 'social-psychology.md',
        fileType: 'text/markdown',
        content: `# Social Psychology

## What is Social Psychology?

Social psychology studies how people's thoughts, feelings, and behaviors are influenced by the actual, imagined, or implied presence of others.

## Social Cognition

### Attribution Theory
How we explain behavior:
- **Internal attribution**: Due to personality/character
- **External attribution**: Due to situation/circumstances

### Fundamental Attribution Error
Tendency to overestimate internal factors and underestimate external factors when explaining others' behavior.

### Self-Serving Bias
- Attribute successes to internal factors
- Attribute failures to external factors

## Attitudes

### Components (ABC Model)
- **Affective**: Feelings
- **Behavioral**: Actions
- **Cognitive**: Beliefs

### Cognitive Dissonance
Discomfort from holding conflicting beliefs or behaving against beliefs. People are motivated to reduce this tension.

## Social Influence

### Conformity
Adjusting behavior to match a group:
- **Asch's Line Experiment**: People conform even when answer is clearly wrong
- Informational influence: Believing others are correct
- Normative influence: Wanting to fit in

### Obedience
Following orders from authority:
- **Milgram's Experiment**: 65% administered maximum shock
- Situational factors strongly influence obedience

### Group Dynamics
- **Social facilitation**: Improved performance with audience
- **Social loafing**: Reduced effort in groups
- **Groupthink**: Desire for harmony leads to poor decisions

## Prejudice and Discrimination

### Stereotypes
Generalized beliefs about a group

### Prejudice
Negative attitudes toward a group

### Discrimination
Negative behavior toward a group

### Reducing Prejudice
- Contact hypothesis: Positive interactions
- Superordinate goals: Cooperation
- Education and awareness

## Prosocial Behavior

### Altruism
Helping without expectation of reward

### Bystander Effect
Less likely to help when others are present:
- Diffusion of responsibility
- Pluralistic ignorance

### Factors Increasing Helping
- Seeing others help
- Personal responsibility
- Similarity to victim
- Good mood`,
      },
    ],
  },
  {
    title: 'Algebra Foundations',
    description: 'Build a solid foundation in algebraic thinking. From basic equations to quadratic functions, develop the mathematical reasoning skills essential for advanced study.',
    slug: 'algebra-foundations',
    category: 'MATHEMATICS',
    visibility: 'PUBLIC',
    published: true,
    files: [
      {
        name: 'Linear Equations',
        originalName: 'linear-equations.md',
        fileType: 'text/markdown',
        content: `# Linear Equations

## What is a Linear Equation?

A linear equation is an equation where the highest power of the variable is 1. It graphs as a straight line.

## Standard Form

**ax + b = c**

Where:
- x is the variable
- a, b, c are constants
- a ≠ 0

## Solving Linear Equations

### Basic Principle
Whatever you do to one side, do to the other.

### Steps
1. Simplify each side (distribute, combine like terms)
2. Move variables to one side
3. Move constants to the other side
4. Divide by the coefficient

### Example
Solve: 3x + 5 = 2x + 12

Solution:
- 3x - 2x + 5 = 12  (subtract 2x from both sides)
- x + 5 = 12
- x = 7  (subtract 5 from both sides)

## Linear Equations in Two Variables

**y = mx + b** (Slope-intercept form)

Where:
- m = slope (rise/run)
- b = y-intercept

### Finding Slope
Given two points (x₁, y₁) and (x₂, y₂):

m = (y₂ - y₁) / (x₂ - x₁)

### Types of Slopes
- Positive slope: Line rises left to right
- Negative slope: Line falls left to right
- Zero slope: Horizontal line
- Undefined slope: Vertical line

## Systems of Linear Equations

Two equations with two variables. Solutions are points where lines intersect.

### Solving Methods

**1. Substitution**
- Solve one equation for a variable
- Substitute into the other equation

**2. Elimination**
- Add/subtract equations to eliminate a variable
- Solve for remaining variable

### Example (Elimination)
2x + y = 10
x - y = 2

Adding equations: 3x = 12, so x = 4
Substituting: 2(4) + y = 10, so y = 2

Solution: (4, 2)

## Word Problems

1. Identify variables
2. Write equation(s) from the problem
3. Solve
4. Check your answer makes sense`,
      },
      {
        name: 'Quadratic Functions',
        originalName: 'quadratic-functions.md',
        fileType: 'text/markdown',
        content: `# Quadratic Functions

## Definition

A quadratic function has the form:

**f(x) = ax² + bx + c** (Standard form)

Where a ≠ 0.

## The Parabola

Quadratic functions graph as parabolas:
- If a > 0: Opens upward (U-shape)
- If a < 0: Opens downward (∩-shape)

## Key Features

### Vertex
The highest or lowest point of the parabola.

Vertex formula: x = -b / 2a

Then find y by substituting back.

### Axis of Symmetry
Vertical line through the vertex: x = -b / 2a

### Y-intercept
Where the parabola crosses the y-axis: (0, c)

### X-intercepts (Roots/Zeros)
Where the parabola crosses the x-axis.
Found by solving ax² + bx + c = 0

## Solving Quadratic Equations

### 1. Factoring
If ax² + bx + c = (px + q)(rx + s), then:
x = -q/p or x = -s/r

Example: x² - 5x + 6 = 0
(x - 2)(x - 3) = 0
x = 2 or x = 3

### 2. Quadratic Formula

**x = (-b ± √(b² - 4ac)) / 2a**

This always works when a ≠ 0.

### 3. Completing the Square
Convert to vertex form: f(x) = a(x - h)² + k

## The Discriminant

**D = b² - 4ac**

- D > 0: Two real solutions
- D = 0: One real solution (vertex touches x-axis)
- D < 0: No real solutions (parabola doesn't cross x-axis)

## Vertex Form

**f(x) = a(x - h)² + k**

Where (h, k) is the vertex.

### Converting Standard to Vertex Form
1. Factor out 'a' from first two terms
2. Complete the square
3. Simplify

## Applications

- Projectile motion (height vs. time)
- Optimization problems
- Revenue and profit functions
- Area problems`,
      },
      {
        name: 'Polynomials and Factoring',
        originalName: 'polynomials-factoring.md',
        fileType: 'text/markdown',
        content: `# Polynomials and Factoring

## What is a Polynomial?

A polynomial is an expression consisting of variables and coefficients, using only addition, subtraction, multiplication, and non-negative integer exponents.

## Terminology

- **Term**: A single part (like 3x²)
- **Coefficient**: The number in front (3 in 3x²)
- **Degree**: Highest exponent (2 in 3x²)
- **Leading coefficient**: Coefficient of highest degree term

## Types by Degree

- Constant: 5 (degree 0)
- Linear: 2x + 1 (degree 1)
- Quadratic: x² - 3x + 2 (degree 2)
- Cubic: x³ + 2x² - x + 4 (degree 3)
- Quartic: x⁴ - 1 (degree 4)

## Operations

### Addition/Subtraction
Combine like terms (same variable and exponent).

(3x² + 2x) + (x² - 5x) = 4x² - 3x

### Multiplication
Use distributive property (FOIL for binomials).

(x + 2)(x + 3) = x² + 3x + 2x + 6 = x² + 5x + 6

## Factoring Techniques

### 1. Greatest Common Factor (GCF)
Find the largest factor common to all terms.

6x³ + 9x² = 3x²(2x + 3)

### 2. Factoring Trinomials (x² + bx + c)
Find two numbers that:
- Multiply to give c
- Add to give b

x² + 7x + 12 = (x + 3)(x + 4)
(because 3 × 4 = 12 and 3 + 4 = 7)

### 3. Difference of Squares
a² - b² = (a + b)(a - b)

x² - 9 = (x + 3)(x - 3)

### 4. Perfect Square Trinomials
a² + 2ab + b² = (a + b)²
a² - 2ab + b² = (a - b)²

x² + 6x + 9 = (x + 3)²

### 5. Factoring by Grouping
For 4-term polynomials, group and factor.

x³ + x² + 2x + 2
= x²(x + 1) + 2(x + 1)
= (x² + 2)(x + 1)

## The Zero Product Property

If ab = 0, then a = 0 or b = 0.

This is why factoring helps solve equations:
x² - 5x + 6 = 0
(x - 2)(x - 3) = 0
x = 2 or x = 3

## Tips for Factoring

1. Always factor out GCF first
2. Check for special patterns
3. Verify by multiplying factors back
4. Some polynomials cannot be factored (prime)`,
      },
    ],
  },
];

// ============ SAMPLE CONTENT ============

const sampleContent = [
  {
    title: 'Welcome to Thynkr',
    description: 'Your journey to better learning starts here',
    content: `# Welcome to Thynkr

Thynkr is your intelligent study companion, designed to help you learn more effectively.

## What You Can Do

- **Upload Study Materials** - PDFs, documents, and notes
- **Generate AI Summaries** - Get concise overviews of your content
- **Create Flashcards** - AI-generated cards for active recall
- **Take Quizzes** - Test your knowledge with smart questions
- **Chat with AI Tutor** - Get help understanding difficult concepts

## Getting Started

1. Browse the public course library
2. Upload your own study materials
3. Let AI help you learn smarter

Start exploring and discover a better way to study!`,
    slug: 'welcome-to-thynkr',
    requiredRole: 'BASIC' as const,
    featured: true,
    published: true,
    tags: ['getting-started', 'welcome'],
  },
  {
    title: 'Effective Study Techniques',
    description: 'Science-backed methods to improve your learning',
    content: `# Effective Study Techniques

Research shows these methods dramatically improve retention and understanding.

## Active Recall

Instead of re-reading, test yourself. Use flashcards, practice questions, or explain concepts from memory.

## Spaced Repetition

Spread your study sessions over time. Review material at increasing intervals for long-term retention.

## The Feynman Technique

1. Choose a concept
2. Explain it in simple terms
3. Identify gaps in your understanding
4. Review and simplify further

## Interleaving

Mix different topics or types of problems in a single session rather than focusing on one thing.

## Take Breaks

The Pomodoro Technique: 25 minutes of focused study, 5-minute break. Longer break after 4 sessions.

Start applying these techniques today for better results!`,
    slug: 'effective-study-techniques',
    requiredRole: 'BASIC' as const,
    featured: true,
    published: true,
    tags: ['study-tips', 'learning'],
  },
];

// ============ MAIN SEED FUNCTION ============

async function cleanSeed() {
  try {
    logger.info('🧹 Starting clean database seed...');

    // Clear existing data (in correct order for foreign keys)
    logger.info('Clearing existing data...');
    
    await prisma.studyCache.deleteMany();
    await prisma.studyPack.deleteMany();
    await prisma.courseFileAI.deleteMany();
    await prisma.courseFile.deleteMany();
    await prisma.course.deleteMany();
    await prisma.flashcard.deleteMany();
    await prisma.flashcardSet.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.quizQuestion.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.fileNotes.deleteMany();
    await prisma.fileSummary.deleteMany();
    await prisma.tutorSessionFile.deleteMany();
    await prisma.tutorMessage.deleteMany();
    await prisma.tutorSession.deleteMany();
    await prisma.uploadedFile.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.studySession.deleteMany();
    await prisma.studyStreak.deleteMany();
    await prisma.content.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.adminLog.deleteMany();
    await prisma.user.deleteMany();

    logger.info('✓ Cleared all existing data');

    // Create users
    logger.info('Creating users...');
    const createdUsers: Record<string, string> = {};

    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      createdUsers[userData.role] = user.id;
      logger.info(`  ✓ Created user: ${userData.firstName} ${userData.lastName} (${userData.email})`);
    }

    // Create content
    logger.info('Creating content articles...');
    for (const contentData of sampleContent) {
      await prisma.content.create({
        data: contentData,
      });
      logger.info(`  ✓ Created content: ${contentData.title}`);
    }

    // Create courses with files
    logger.info('Creating courses with files...');
    const teacherId = createdUsers['PREMIUM']; // Prof. Chen

    for (const courseData of sampleCourses) {
      const { files, ...courseInfo } = courseData;

      // Create course
      const course = await prisma.course.create({
        data: {
          ...courseInfo,
          createdBy: teacherId,
        },
      });

      // Create course files with AI content
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        const fileName = `${courseData.slug}-${i + 1}.md`;
        const filePath = `/seed-files/${fileName}`;

        const courseFile = await prisma.courseFile.create({
          data: {
            courseId: course.id,
            name: fileData.name,
            originalName: fileData.originalName,
            fileName: fileName,
            filePath: filePath,
            fileType: fileData.fileType,
            fileSize: fileData.content.length,
            order: i,
            accessType: 'INTERNAL',
          },
        });

        // Create AI content for the file
        await prisma.courseFileAI.create({
          data: {
            fileId: courseFile.id,
            extractedText: fileData.content,
            summary: {
              content: generateSummary(fileData.content),
            },
            notes: {
              keyPoints: extractKeyPoints(fileData.content),
              detailed: fileData.content,
            },
            summaryGeneratedAt: new Date(),
            notesGeneratedAt: new Date(),
          },
        });

        logger.info(`    ✓ Created file: ${fileData.name}`);
      }

      logger.info(`  ✓ Created course: ${courseData.title}`);
    }

    // Create sample study streak for demo user
    const studentId = createdUsers['STANDARD'];
    await prisma.studyStreak.create({
      data: {
        userId: studentId,
        currentStreak: 5,
        longestStreak: 12,
        lastStudyDate: new Date(),
        totalStudyDays: 23,
        totalMinutes: 1840,
      },
    });
    logger.info('  ✓ Created study streak for student');

    // Create admin log entry
    await prisma.adminLog.create({
      data: {
        action: 'DATABASE_SEED',
        details: 'Database seeded with clean demo data',
        userEmail: 'admin@thynkr.edu',
        status: 'SUCCESS',
      },
    });

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('✅ Database seed completed successfully!');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
    logger.info('Demo Accounts:');
    logger.info('  Admin:   admin@thynkr.edu / AdminPass123!');
    logger.info('  Teacher: teacher@thynkr.edu / TeacherPass123!');
    logger.info('  Student: student@thynkr.edu / StudentPass123!');
    logger.info('  Demo:    demo@thynkr.edu / DemoPass123!');
    logger.info('');
    logger.info('Sample Courses:');
    sampleCourses.forEach((c) => logger.info(`  - ${c.title} (${c.files.length} files)`));
    logger.info('');

  } catch (error) {
    logger.error('❌ Database seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions

function generateSummary(content: string): string {
  // Extract first paragraph or section as summary
  const lines = content.split('\n').filter(line => 
    line.trim() && 
    !line.startsWith('#') && 
    !line.startsWith('```') &&
    !line.startsWith('-') &&
    !line.startsWith('*')
  );
  
  const summaryLines = lines.slice(0, 3);
  return summaryLines.join(' ').substring(0, 500) + '...';
}

function extractKeyPoints(content: string): string[] {
  // Extract headings as key points
  const headings = content
    .split('\n')
    .filter(line => line.startsWith('## ') || line.startsWith('### '))
    .map(line => line.replace(/^#+\s*/, ''))
    .slice(0, 8);
  
  return headings.length > 0 ? headings : ['Key concepts covered in this material'];
}

// Run the seed
cleanSeed();
