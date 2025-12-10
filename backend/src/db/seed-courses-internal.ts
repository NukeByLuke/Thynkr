import prisma from './client';
import { logger } from '../lib/logger';

// ============================================================
// Course Content: Realistic academic materials for AI processing
// ============================================================

const courseContent = {
  // ============ PSYCHOLOGY ============
  psychology_intro: `# Foundations of Psychology

## What is Psychology?

Psychology is the scientific study of mind and behavior. The word "psychology" comes from the Greek words psyche (soul/mind) and logos (study of).

### Major Perspectives in Psychology

**1. Biological Perspective**
- Focuses on how the brain, genes, and neurotransmitters influence behavior
- Key concepts: Neural pathways, hormones, genetics
- Example: How dopamine affects motivation and pleasure

**2. Cognitive Perspective**
- Studies mental processes: thinking, memory, problem-solving
- Key figures: Jean Piaget, Aaron Beck
- Applications: Cognitive behavioral therapy (CBT)

**3. Behavioral Perspective**
- Focuses on observable behaviors and environmental influences
- Key figures: B.F. Skinner, Ivan Pavlov
- Concepts: Classical conditioning, operant conditioning

**4. Humanistic Perspective**
- Emphasizes free will, personal growth, and self-actualization
- Key figures: Carl Rogers, Abraham Maslow
- Famous theory: Maslow's Hierarchy of Needs

## Research Methods

### Experimental Method
- Independent variable: What the researcher manipulates
- Dependent variable: What is measured
- Control group vs. experimental group

### Observational Studies
- Naturalistic observation
- Case studies
- Surveys and questionnaires

### Correlation vs. Causation
Correlation does not imply causation. Just because two variables are related does not mean one causes the other.

## The Brain and Behavior

### Brain Structures
- **Cerebral cortex**: Higher-order thinking, language
- **Limbic system**: Emotions, memory (hippocampus, amygdala)
- **Brainstem**: Basic life functions (breathing, heartbeat)

### Neurotransmitters
- Serotonin: Mood regulation
- Dopamine: Reward and motivation
- Norepinephrine: Arousal and alertness
- GABA: Inhibitory, reduces anxiety`,

  psychology_development: `# Human Development Psychology

## Developmental Stages

### Prenatal Development
- Germinal stage (0-2 weeks)
- Embryonic stage (3-8 weeks)
- Fetal stage (9 weeks - birth)

## Piaget's Cognitive Development

**1. Sensorimotor Stage (0-2 years)**
- Learning through senses and motor actions
- Object permanence develops

**2. Preoperational Stage (2-7 years)**
- Symbolic thinking begins
- Egocentric thinking
- Lacks conservation

**3. Concrete Operational Stage (7-11 years)**
- Logical thinking about concrete objects
- Understands conservation

**4. Formal Operational Stage (12+ years)**
- Abstract and hypothetical thinking
- Systematic problem-solving

## Erikson's Psychosocial Development

| Stage | Age | Conflict |
|-------|-----|----------|
| 1 | 0-1 | Trust vs. Mistrust |
| 2 | 1-3 | Autonomy vs. Shame |
| 3 | 3-6 | Initiative vs. Guilt |
| 4 | 6-12 | Industry vs. Inferiority |
| 5 | 12-18 | Identity vs. Role Confusion |
| 6 | 18-40 | Intimacy vs. Isolation |
| 7 | 40-65 | Generativity vs. Stagnation |
| 8 | 65+ | Integrity vs. Despair |

## Attachment Theory (John Bowlby)

### Attachment Styles
- **Secure attachment**: Confident, comfortable with intimacy
- **Anxious-preoccupied**: Fear of abandonment, clingy
- **Dismissive-avoidant**: Emotionally distant, independent
- **Fearful-avoidant**: Desire closeness but fear rejection

## Moral Development (Lawrence Kohlberg)

**Pre-conventional Level**
- Stage 1: Punishment avoidance
- Stage 2: Self-interest

**Conventional Level**
- Stage 3: Social approval
- Stage 4: Law and order

**Post-conventional Level**
- Stage 5: Social contract
- Stage 6: Universal ethical principles`,

  psychology_abnormal: `# Understanding Mental Health

## What is Abnormal Psychology?

Abnormal psychology studies atypical patterns of behavior, emotion, and thought that may or may not be a mental disorder.

### The 4 D's of Abnormality
1. **Deviance**: Different from cultural norms
2. **Distress**: Causes suffering to the individual
3. **Dysfunction**: Interferes with daily life
4. **Danger**: Poses risk to self or others

## Common Mental Health Conditions

### Anxiety Disorders
- Generalized Anxiety Disorder (GAD)
- Panic Disorder
- Social Anxiety Disorder
- Specific Phobias
- Obsessive-Compulsive Disorder (OCD)

**Symptoms**: Excessive worry, restlessness, fatigue, difficulty concentrating

### Mood Disorders
- Major Depressive Disorder
- Bipolar Disorder
- Persistent Depressive Disorder (Dysthymia)

**Depression symptoms**: Sadness, loss of interest, sleep changes, fatigue, feelings of worthlessness

### Trauma-Related Disorders
- Post-Traumatic Stress Disorder (PTSD)
- Acute Stress Disorder

**PTSD symptoms**: Flashbacks, nightmares, avoidance, hypervigilance

## Treatment Approaches

### Psychotherapy
- **Cognitive Behavioral Therapy (CBT)**: Identifies and changes negative thought patterns
- **Psychodynamic Therapy**: Explores unconscious processes
- **Humanistic Therapy**: Client-centered, emphasizes self-growth

### Medications
- Antidepressants (SSRIs, SNRIs)
- Anti-anxiety medications (benzodiazepines)
- Mood stabilizers
- Antipsychotics

### Evidence-Based Treatments
Research supports that therapy combined with medication often produces the best outcomes for many conditions.

## Reducing Stigma

Mental health conditions are medical conditions. They are:
- Common (1 in 5 adults experience mental illness)
- Treatable with proper care
- Not a personal weakness or character flaw`,

  // ============ WEB DEVELOPMENT ============
  webdev_html_css: `# HTML & CSS Fundamentals

## Introduction to HTML

HTML (HyperText Markup Language) provides the structure of web pages.

### Basic HTML Document Structure

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My First Page</title>
</head>
<body>
  <h1>Welcome!</h1>
  <p>This is my first web page.</p>
</body>
</html>
\`\`\`

### Essential HTML Elements

**Headings**: \`<h1>\` through \`<h6>\`
**Paragraphs**: \`<p>\`
**Links**: \`<a href="url">Link text</a>\`
**Images**: \`<img src="image.jpg" alt="Description">\`
**Lists**: \`<ul>\`, \`<ol>\`, \`<li>\`
**Divisions**: \`<div>\` for grouping content
**Spans**: \`<span>\` for inline styling

### Semantic HTML5

\`\`\`html
<header>Site header</header>
<nav>Navigation menu</nav>
<main>Main content</main>
<article>Self-contained content</article>
<section>Grouped content</section>
<aside>Sidebar content</aside>
<footer>Site footer</footer>
\`\`\`

## CSS (Cascading Style Sheets)

CSS controls the visual presentation of HTML elements.

### CSS Selectors

\`\`\`css
/* Element selector */
p { color: blue; }

/* Class selector */
.highlight { background: yellow; }

/* ID selector */
#header { font-size: 24px; }

/* Descendant selector */
article p { line-height: 1.6; }

/* Attribute selector */
input[type="text"] { border: 1px solid gray; }
\`\`\`

### The Box Model

Every HTML element is a box with:
- **Content**: The actual content
- **Padding**: Space inside the border
- **Border**: The edge of the box
- **Margin**: Space outside the border

\`\`\`css
.box {
  width: 300px;
  padding: 20px;
  border: 2px solid #333;
  margin: 10px;
  box-sizing: border-box; /* Includes padding/border in width */
}
\`\`\`

### Flexbox Layout

\`\`\`css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.item {
  flex: 1; /* Grow equally */
}
\`\`\`

### CSS Grid

\`\`\`css
.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
\`\`\`

### Responsive Design

\`\`\`css
/* Mobile-first approach */
.card { width: 100%; }

@media (min-width: 768px) {
  .card { width: 50%; }
}

@media (min-width: 1024px) {
  .card { width: 33.33%; }
}
\`\`\``,

  webdev_javascript: `# JavaScript Essentials

## JavaScript Basics

JavaScript is the programming language of the web, enabling interactive and dynamic content.

### Variables and Data Types

\`\`\`javascript
// Modern variable declarations
const PI = 3.14159;        // Cannot be reassigned
let count = 0;             // Block-scoped, reassignable
var oldStyle = "avoid";    // Function-scoped (legacy)

// Data types
const name = "Alice";      // String
const age = 25;            // Number
const isStudent = true;    // Boolean
const nothing = null;      // Null
let notDefined;            // Undefined
const person = {};         // Object
const numbers = [];        // Array
\`\`\`

### Functions

\`\`\`javascript
// Function declaration
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Arrow function
const add = (a, b) => a + b;

// Default parameters
function multiply(a, b = 1) {
  return a * b;
}

// Callback function
const numbers = [1, 2, 3];
numbers.forEach(num => console.log(num));
\`\`\`

### Arrays

\`\`\`javascript
const fruits = ['apple', 'banana', 'orange'];

// Array methods
fruits.push('grape');          // Add to end
fruits.pop();                  // Remove from end
fruits.unshift('mango');       // Add to start
fruits.shift();                // Remove from start

// Functional array methods
const doubled = [1, 2, 3].map(x => x * 2);
const evens = [1, 2, 3, 4].filter(x => x % 2 === 0);
const sum = [1, 2, 3].reduce((acc, x) => acc + x, 0);
const found = fruits.find(f => f === 'apple');
\`\`\`

### Objects

\`\`\`javascript
const user = {
  name: 'John',
  age: 30,
  email: 'john@example.com',
  greet() {
    return \`Hi, I'm \${this.name}\`;
  }
};

// Destructuring
const { name, age } = user;

// Spread operator
const updatedUser = { ...user, age: 31 };
\`\`\`

### Asynchronous JavaScript

\`\`\`javascript
// Promises
fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));

// Async/await
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
\`\`\`

### DOM Manipulation

\`\`\`javascript
// Selecting elements
const element = document.getElementById('myId');
const elements = document.querySelectorAll('.myClass');

// Modifying elements
element.textContent = 'New text';
element.innerHTML = '<strong>Bold</strong>';
element.classList.add('active');
element.style.color = 'blue';

// Event listeners
element.addEventListener('click', (event) => {
  console.log('Clicked!', event.target);
});
\`\`\``,

  webdev_react: `# Introduction to React

## What is React?

React is a JavaScript library for building user interfaces, developed by Facebook.

### Core Concepts

1. **Components**: Reusable UI building blocks
2. **JSX**: JavaScript syntax extension for writing HTML-like code
3. **Props**: Data passed from parent to child components
4. **State**: Component's internal data that can change

## Components

### Function Components

\`\`\`jsx
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Arrow function syntax
const Greeting = ({ message }) => (
  <p>{message}</p>
);
\`\`\`

### Using Components

\`\`\`jsx
function App() {
  return (
    <div>
      <Welcome name="Alice" />
      <Welcome name="Bob" />
    </div>
  );
}
\`\`\`

## State Management

### useState Hook

\`\`\`jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

### useEffect Hook

\`\`\`jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const response = await fetch(\`/api/users/\${userId}\`);
      const data = await response.json();
      setUser(data);
      setLoading(false);
    }
    fetchUser();
  }, [userId]); // Runs when userId changes

  if (loading) return <p>Loading...</p>;
  return <h2>{user.name}</h2>;
}
\`\`\`

## Handling Events

\`\`\`jsx
function LoginForm() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
      />
      <button type="submit">Login</button>
    </form>
  );
}
\`\`\`

## Conditional Rendering

\`\`\`jsx
function Dashboard({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? (
        <h1>Welcome back!</h1>
      ) : (
        <h1>Please log in</h1>
      )}
    </div>
  );
}
\`\`\`

## Lists and Keys

\`\`\`jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  );
}
\`\`\``,

  // ============ ALGEBRA ============
  algebra_foundations: `# Algebra Essentials

## Introduction to Algebra

Algebra is the branch of mathematics that uses symbols and letters to represent numbers and quantities in formulas and equations.

### Variables and Expressions

**Variable**: A symbol (usually a letter) representing an unknown value
**Constant**: A fixed value
**Expression**: Combination of variables, constants, and operations

Examples:
- 3x + 5 is an expression
- x is a variable
- 5 is a constant

### Order of Operations (PEMDAS)

1. **P**arentheses
2. **E**xponents
3. **M**ultiplication and **D**ivision (left to right)
4. **A**ddition and **S**ubtraction (left to right)

Example: 3 + 4 × 2² = 3 + 4 × 4 = 3 + 16 = 19

## Solving Linear Equations

### One-Variable Equations

Goal: Isolate the variable on one side

**Example**: Solve 2x + 5 = 13
1. Subtract 5 from both sides: 2x = 8
2. Divide both sides by 2: x = 4

**Example**: Solve 3(x - 2) = 15
1. Distribute: 3x - 6 = 15
2. Add 6: 3x = 21
3. Divide by 3: x = 7

### Two-Variable Equations

Standard form: ax + by = c
Slope-intercept form: y = mx + b (where m = slope, b = y-intercept)

## Systems of Equations

### Substitution Method

Solve: y = 2x + 1 and x + y = 7

1. Substitute: x + (2x + 1) = 7
2. Simplify: 3x + 1 = 7
3. Solve: x = 2
4. Substitute back: y = 2(2) + 1 = 5

Solution: (2, 5)

### Elimination Method

Solve: 2x + y = 7 and x - y = 2

1. Add equations: 3x = 9
2. Solve: x = 3
3. Substitute: 3 - y = 2, so y = 1

Solution: (3, 1)`,

  algebra_quadratics: `# Quadratic Equations

## Understanding Quadratics

A quadratic equation has the form: **ax² + bx + c = 0**

The graph is a parabola:
- Opens upward if a > 0
- Opens downward if a < 0

### Key Features
- **Vertex**: Highest or lowest point
- **Axis of symmetry**: x = -b/(2a)
- **Y-intercept**: (0, c)
- **X-intercepts**: Solutions (roots) of the equation

## Solving Quadratic Equations

### Method 1: Factoring

**Example**: Solve x² - 5x + 6 = 0

1. Find factors: (x - 2)(x - 3) = 0
2. Set each factor to zero: x - 2 = 0 or x - 3 = 0
3. Solutions: x = 2 or x = 3

### Method 2: Quadratic Formula

For ax² + bx + c = 0:

**x = (-b ± √(b² - 4ac)) / 2a**

**Example**: Solve 2x² + 5x - 3 = 0

a = 2, b = 5, c = -3

x = (-5 ± √(25 + 24)) / 4
x = (-5 ± √49) / 4
x = (-5 ± 7) / 4

x = 2/4 = 0.5 or x = -12/4 = -3

### Method 3: Completing the Square

**Example**: Solve x² + 6x + 5 = 0

1. Move constant: x² + 6x = -5
2. Complete square: x² + 6x + 9 = -5 + 9
3. Factor: (x + 3)² = 4
4. Square root: x + 3 = ±2
5. Solve: x = -1 or x = -5

## The Discriminant

The discriminant: **D = b² - 4ac**

- If D > 0: Two distinct real solutions
- If D = 0: One repeated real solution
- If D < 0: No real solutions (two complex solutions)

## Applications

Quadratics model many real-world situations:
- Projectile motion
- Area optimization
- Revenue/profit maximization
- Bridge and arch shapes`,

  algebra_functions: `# Functions and Graphs

## What is a Function?

A function assigns exactly one output to each input.

**Notation**: f(x) = expression
- x is the input (independent variable)
- f(x) is the output (dependent variable)

### Function Examples

- Linear: f(x) = 2x + 3
- Quadratic: f(x) = x² - 4
- Absolute value: f(x) = |x|
- Square root: f(x) = √x

### Domain and Range

**Domain**: All possible input values
**Range**: All possible output values

Example: f(x) = √x
- Domain: x ≥ 0 (can't take square root of negative)
- Range: f(x) ≥ 0 (square root is always non-negative)

## Graphing Functions

### Transformations

Starting with parent function y = f(x):

| Transformation | Result |
|---------------|--------|
| f(x) + k | Shift up k units |
| f(x) - k | Shift down k units |
| f(x + h) | Shift left h units |
| f(x - h) | Shift right h units |
| af(x) | Vertical stretch (a > 1) or compression (0 < a < 1) |
| -f(x) | Reflect over x-axis |
| f(-x) | Reflect over y-axis |

## Linear Functions

**Slope-intercept form**: y = mx + b
- m = slope (rise/run)
- b = y-intercept

**Finding slope**: m = (y₂ - y₁)/(x₂ - x₁)

### Parallel and Perpendicular Lines
- Parallel lines: Same slope
- Perpendicular lines: Slopes are negative reciprocals (m₁ × m₂ = -1)

## Function Operations

- (f + g)(x) = f(x) + g(x)
- (f - g)(x) = f(x) - g(x)
- (f × g)(x) = f(x) × g(x)
- (f / g)(x) = f(x) / g(x), where g(x) ≠ 0
- (f ∘ g)(x) = f(g(x)) [composition]

## Inverse Functions

If f and f⁻¹ are inverses: f(f⁻¹(x)) = x

To find inverse:
1. Replace f(x) with y
2. Swap x and y
3. Solve for y
4. Replace y with f⁻¹(x)`,

  // ============ LITERATURE ============
  literature_analysis: `# Literary Analysis Techniques

## What is Literary Analysis?

Literary analysis involves examining the elements of a text to understand its meaning and craft.

### The Elements of Literature

**1. Plot**
- Exposition: Introduction of characters and setting
- Rising action: Building tension
- Climax: Turning point
- Falling action: Events after climax
- Resolution: Conclusion

**2. Character**
- Protagonist: Main character
- Antagonist: Opposing force
- Static vs. dynamic characters
- Flat vs. round characters

**3. Setting**
- Time and place
- Atmosphere and mood
- Cultural and historical context

**4. Theme**
- Central idea or message
- Universal truth about human nature
- Examples: Love conquers all, good vs. evil, coming of age

**5. Point of View**
- First person: "I" narrator
- Second person: "You" (rare)
- Third person limited: Follows one character's perspective
- Third person omniscient: All-knowing narrator

## Literary Devices

### Figurative Language

**Simile**: Comparison using "like" or "as"
- "Her smile was like sunshine"

**Metaphor**: Direct comparison
- "Life is a journey"

**Personification**: Giving human qualities to non-human things
- "The wind whispered through the trees"

**Hyperbole**: Exaggeration
- "I've told you a million times"

### Sound Devices

**Alliteration**: Repeated consonant sounds
- "Peter Piper picked a peck"

**Assonance**: Repeated vowel sounds
- "The rain in Spain stays mainly in the plain"

**Onomatopoeia**: Words that imitate sounds
- Buzz, crash, sizzle

### Structural Devices

**Foreshadowing**: Hints about future events
**Flashback**: Scene from the past
**Irony**: Contrast between expectation and reality
- Verbal: Saying opposite of what's meant
- Situational: Outcome opposite of expected
- Dramatic: Audience knows something characters don't

## Writing Literary Analysis

1. **Thesis statement**: Clear argument about the text
2. **Evidence**: Direct quotes from the text
3. **Analysis**: Explain how evidence supports thesis
4. **Conclusion**: Broader significance`,

  literature_movements: `# Major Literary Movements

## Romanticism (1780-1850)

### Characteristics
- Emphasis on emotion and individualism
- Celebration of nature
- Interest in the supernatural
- Rejection of industrialization
- Idealization of the past

### Key Authors
- William Wordsworth
- Samuel Taylor Coleridge
- John Keats
- Percy Bysshe Shelley
- Mary Shelley (Frankenstein)
- Edgar Allan Poe

### Key Works
- "I Wandered Lonely as a Cloud" (Wordsworth)
- "The Rime of the Ancient Mariner" (Coleridge)
- "Frankenstein" (Mary Shelley)

## Realism (1850-1900)

### Characteristics
- Focus on everyday life
- Objective representation of reality
- Character development over plot
- Social critique
- Middle and lower class subjects

### Key Authors
- Charles Dickens
- Mark Twain
- Gustave Flaubert
- Leo Tolstoy
- Henry James

### Key Works
- "Great Expectations" (Dickens)
- "Adventures of Huckleberry Finn" (Twain)
- "War and Peace" (Tolstoy)

## Modernism (1900-1940)

### Characteristics
- Break from tradition
- Experimentation with form
- Stream of consciousness
- Fragmented narratives
- Alienation and disillusionment
- Multiple perspectives

### Key Authors
- James Joyce
- Virginia Woolf
- T.S. Eliot
- F. Scott Fitzgerald
- Ernest Hemingway
- William Faulkner

### Key Works
- "Ulysses" (Joyce)
- "Mrs. Dalloway" (Woolf)
- "The Waste Land" (Eliot)
- "The Great Gatsby" (Fitzgerald)

## Postmodernism (1945-present)

### Characteristics
- Rejection of absolute truth
- Metafiction (self-aware narratives)
- Irony and playfulness
- Blending of genres
- Unreliable narrators
- Pastiche and parody

### Key Authors
- Samuel Beckett
- Jorge Luis Borges
- Thomas Pynchon
- Toni Morrison
- Don DeLillo

### Key Works
- "Waiting for Godot" (Beckett)
- "Beloved" (Morrison)
- "White Noise" (DeLillo)`,

  literature_shakespeare: `# Understanding Shakespeare

## Shakespeare's World

William Shakespeare (1564-1616) wrote during the English Renaissance and is considered the greatest writer in the English language.

### The Globe Theatre
- Open-air amphitheater in London
- Audience of all social classes
- No artificial lighting—performances during day
- Minimal sets, elaborate costumes

## Shakespeare's Works

### Tragedies
- **Hamlet**: Prince seeks revenge for his father's murder
- **Macbeth**: Ambition leads to downfall
- **Othello**: Jealousy destroys a great man
- **King Lear**: A king's poor judgment destroys his family

### Comedies
- **A Midsummer Night's Dream**: Love and magic in the forest
- **Much Ado About Nothing**: Witty romantic battles
- **Twelfth Night**: Mistaken identity and love

### Histories
- **Henry V**: Young king proves himself in war
- **Richard III**: A villain's rise and fall

## Reading Shakespeare

### Iambic Pentameter
Shakespeare's verse follows a pattern:
- 10 syllables per line
- Alternating unstressed/stressed syllables
- "But SOFT, what LIGHT through YONder WINdow BREAKS"

### Common Vocabulary

| Shakespeare | Modern |
|------------|--------|
| Thou | You (singular, informal) |
| Thee | You (object) |
| Thy/Thine | Your/Yours |
| Art | Are |
| Dost | Do |
| Hath | Has |
| 'Twas | It was |
| Wherefore | Why |
| Hence | From here |
| Anon | Soon |

## Key Themes

**Appearance vs. Reality**
- Characters disguise themselves
- Things are not what they seem
- "All that glitters is not gold"

**The Nature of Power**
- What makes a good ruler?
- Corruption of power
- Divine right vs. earned authority

**Love in All Forms**
- Romantic love
- Familial love
- Love of power
- Love and jealousy

**Fate vs. Free Will**
- Are we in control of our destiny?
- The role of prophecy
- Personal responsibility`,

  // ============ BIOLOGY ============
  biology_cells: `# Cell Biology Fundamentals

## Introduction to Cells

The cell is the basic structural and functional unit of all living organisms.

### Cell Theory
1. All living things are composed of cells
2. Cells are the basic unit of structure and function
3. All cells come from pre-existing cells

## Types of Cells

### Prokaryotic Cells
- No membrane-bound nucleus
- DNA in nucleoid region
- Smaller (1-5 μm)
- Examples: Bacteria, Archaea

### Eukaryotic Cells
- Membrane-bound nucleus
- Complex organelles
- Larger (10-100 μm)
- Examples: Animals, Plants, Fungi, Protists

## Cell Organelles

### Nucleus
- Contains genetic material (DNA)
- Controls cell activities
- Nuclear envelope with pores
- Nucleolus produces ribosomes

### Mitochondria
- "Powerhouse of the cell"
- Produces ATP through cellular respiration
- Double membrane structure
- Contains own DNA

### Endoplasmic Reticulum (ER)
**Rough ER**:
- Studded with ribosomes
- Protein synthesis and modification

**Smooth ER**:
- No ribosomes
- Lipid synthesis
- Detoxification

### Golgi Apparatus
- Modifies, packages, and ships proteins
- Creates lysosomes
- Stack of flattened membranes

### Lysosomes
- Contain digestive enzymes
- Break down waste and debris
- "Recycling center" of cell

### Ribosomes
- Site of protein synthesis
- Found free or attached to ER
- Made of RNA and protein

## Plant vs. Animal Cells

| Feature | Plant Cell | Animal Cell |
|---------|-----------|-------------|
| Cell Wall | Yes (cellulose) | No |
| Chloroplasts | Yes | No |
| Central Vacuole | Large | Small/none |
| Shape | Fixed (rectangular) | Variable |
| Centrioles | No | Yes |

## Cell Membrane

### Structure
- Phospholipid bilayer
- Embedded proteins
- Fluid mosaic model

### Functions
- Selective permeability
- Cell recognition
- Cell signaling
- Structural support`,

  biology_genetics: `# Genetics and Heredity

## DNA: The Genetic Material

### DNA Structure
- Double helix
- Nucleotides: Sugar + Phosphate + Base
- Bases: Adenine (A), Thymine (T), Guanine (G), Cytosine (C)
- Base pairing: A-T, G-C

### DNA Replication
1. Helicase unwinds DNA
2. DNA polymerase adds complementary nucleotides
3. Two identical DNA molecules produced
4. Semi-conservative replication

## Gene Expression

### Transcription (DNA → RNA)
- Occurs in nucleus
- RNA polymerase builds mRNA
- Template strand read 3' to 5'
- mRNA built 5' to 3'

### Translation (RNA → Protein)
- Occurs at ribosomes
- mRNA read in codons (3 bases)
- tRNA brings amino acids
- Polypeptide chain formed

### The Genetic Code
- 64 codons for 20 amino acids
- Redundant (multiple codons per amino acid)
- Universal (same in all organisms)
- AUG = start codon (methionine)
- UAA, UAG, UGA = stop codons

## Mendelian Genetics

### Key Terms
- **Gene**: Unit of heredity
- **Allele**: Different versions of a gene
- **Dominant**: Expressed when present (A)
- **Recessive**: Expressed only if homozygous (a)
- **Genotype**: Genetic makeup (AA, Aa, aa)
- **Phenotype**: Physical expression

### Punnett Squares

Cross: Aa × Aa

|   | A | a |
|---|---|---|
| A | AA | Aa |
| a | Aa | aa |

Results: 25% AA, 50% Aa, 25% aa
Phenotype ratio: 3:1

## Beyond Mendel

### Incomplete Dominance
- Heterozygote shows intermediate phenotype
- Red × White = Pink

### Codominance
- Both alleles fully expressed
- Blood type: AB shows both A and B

### Sex-Linked Traits
- Genes on X chromosome
- Males more affected (XY)
- Examples: Color blindness, hemophilia

## Mutations

### Types
- **Point mutation**: Single base change
- **Insertion**: Extra bases added
- **Deletion**: Bases removed
- **Frameshift**: Changes reading frame

### Effects
- Silent: No change in protein
- Missense: Different amino acid
- Nonsense: Premature stop codon`,

  biology_ecology: `# Ecology: Organisms and Their Environment

## Levels of Organization

1. **Organism**: Individual living thing
2. **Population**: Same species in an area
3. **Community**: All populations in an area
4. **Ecosystem**: Community + physical environment
5. **Biome**: Large geographic region with similar climate
6. **Biosphere**: All life on Earth

## Energy Flow

### Food Chains and Webs
- **Producers**: Make their own food (plants)
- **Primary consumers**: Herbivores
- **Secondary consumers**: Carnivores eating herbivores
- **Tertiary consumers**: Top predators
- **Decomposers**: Break down dead matter

### Energy Pyramid
- Only 10% of energy transfers between levels
- Explains why food chains are short
- More producers than consumers

## Nutrient Cycles

### Carbon Cycle
1. Plants absorb CO₂ (photosynthesis)
2. Animals eat plants
3. Respiration releases CO₂
4. Decomposition releases carbon
5. Fossil fuels store carbon

### Nitrogen Cycle
1. Nitrogen fixation (N₂ → NH₃)
2. Nitrification (NH₃ → NO₃⁻)
3. Assimilation by plants
4. Decomposition
5. Denitrification (back to N₂)

### Water Cycle
- Evaporation
- Condensation
- Precipitation
- Runoff
- Groundwater

## Population Ecology

### Growth Patterns
**Exponential growth**: J-curve, unlimited resources
**Logistic growth**: S-curve, limited by carrying capacity

### Population Factors

**Density-dependent**:
- Competition
- Predation
- Disease
- Parasitism

**Density-independent**:
- Weather
- Natural disasters
- Human activities

## Ecological Relationships

### Symbiosis
- **Mutualism**: Both benefit (+/+)
- **Commensalism**: One benefits, other neutral (+/0)
- **Parasitism**: One benefits, other harmed (+/-)

### Competition
- Intraspecific: Same species
- Interspecific: Different species
- Competitive exclusion principle

### Predator-Prey Dynamics
- Populations cycle together
- Prey increase → Predators increase
- Predators increase → Prey decrease

## Biodiversity

### Importance
- Ecosystem stability
- Genetic resources
- Economic value
- Aesthetic value

### Threats
- Habitat destruction
- Pollution
- Overexploitation
- Invasive species
- Climate change`,
};

// ============================================================
// Course Definitions
// ============================================================

interface CourseFileData {
  name: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  order: number;
  accessType: 'INTERNAL' | 'DOWNLOADABLE';
  content: string;
}

interface CourseData {
  title: string;
  description: string;
  slug: string;
  category: 'MATHEMATICS' | 'SCIENCE' | 'TECHNOLOGY' | 'HUMANITIES' | 'OTHER';
  visibility: 'PUBLIC' | 'PRIVATE';
  published: boolean;
  files: CourseFileData[];
}

const coursesData: CourseData[] = [
  // ============ 1. FOUNDATIONS OF PSYCHOLOGY ============
  {
    title: 'Foundations of Psychology',
    description: 'Explore the scientific study of mind and behavior. Learn about major psychological perspectives, research methods, development, and mental health fundamentals.',
    slug: 'foundations-of-psychology',
    category: 'HUMANITIES',
    visibility: 'PUBLIC',
    published: true,
    files: [
      {
        name: 'Introduction to Psychology',
        originalName: 'Psychology_Introduction.pdf',
        fileName: 'psychology_intro.pdf',
        filePath: '/courses/psychology/intro.pdf',
        fileType: 'application/pdf',
        fileSize: 285000,
        order: 0,
        accessType: 'INTERNAL',
        content: courseContent.psychology_intro,
      },
      {
        name: 'Human Development',
        originalName: 'Developmental_Psychology.pdf',
        fileName: 'psychology_development.pdf',
        filePath: '/courses/psychology/development.pdf',
        fileType: 'application/pdf',
        fileSize: 312000,
        order: 1,
        accessType: 'INTERNAL',
        content: courseContent.psychology_development,
      },
      {
        name: 'Understanding Mental Health',
        originalName: 'Abnormal_Psychology.pdf',
        fileName: 'psychology_abnormal.pdf',
        filePath: '/courses/psychology/abnormal.pdf',
        fileType: 'application/pdf',
        fileSize: 298000,
        order: 2,
        accessType: 'INTERNAL',
        content: courseContent.psychology_abnormal,
      },
    ],
  },

  // ============ 2. WEB DEVELOPMENT 101 ============
  {
    title: 'Web Development 101',
    description: 'Start your journey into web development with HTML, CSS, JavaScript, and React. Build modern, responsive websites from scratch.',
    slug: 'web-development-101',
    category: 'TECHNOLOGY',
    visibility: 'PUBLIC',
    published: true,
    files: [
      {
        name: 'HTML & CSS Fundamentals',
        originalName: 'HTML_CSS_Basics.pdf',
        fileName: 'webdev_html_css.pdf',
        filePath: '/courses/webdev/html_css.pdf',
        fileType: 'application/pdf',
        fileSize: 425000,
        order: 0,
        accessType: 'INTERNAL',
        content: courseContent.webdev_html_css,
      },
      {
        name: 'JavaScript Essentials',
        originalName: 'JavaScript_Guide.pdf',
        fileName: 'webdev_javascript.pdf',
        filePath: '/courses/webdev/javascript.pdf',
        fileType: 'application/pdf',
        fileSize: 467000,
        order: 1,
        accessType: 'INTERNAL',
        content: courseContent.webdev_javascript,
      },
      {
        name: 'Introduction to React',
        originalName: 'React_Fundamentals.pdf',
        fileName: 'webdev_react.pdf',
        filePath: '/courses/webdev/react.pdf',
        fileType: 'application/pdf',
        fileSize: 389000,
        order: 2,
        accessType: 'INTERNAL',
        content: courseContent.webdev_react,
      },
    ],
  },

  // ============ 3. ALGEBRA ESSENTIALS ============
  {
    title: 'Algebra Essentials',
    description: 'Master the foundations of algebra including variables, equations, quadratics, and functions. Perfect for students preparing for higher mathematics.',
    slug: 'algebra-essentials',
    category: 'MATHEMATICS',
    visibility: 'PUBLIC',
    published: true,
    files: [
      {
        name: 'Foundations of Algebra',
        originalName: 'Algebra_Foundations.pdf',
        fileName: 'algebra_foundations.pdf',
        filePath: '/courses/algebra/foundations.pdf',
        fileType: 'application/pdf',
        fileSize: 267000,
        order: 0,
        accessType: 'INTERNAL',
        content: courseContent.algebra_foundations,
      },
      {
        name: 'Quadratic Equations',
        originalName: 'Quadratics.pdf',
        fileName: 'algebra_quadratics.pdf',
        filePath: '/courses/algebra/quadratics.pdf',
        fileType: 'application/pdf',
        fileSize: 289000,
        order: 1,
        accessType: 'INTERNAL',
        content: courseContent.algebra_quadratics,
      },
      {
        name: 'Functions and Graphs',
        originalName: 'Functions.pdf',
        fileName: 'algebra_functions.pdf',
        filePath: '/courses/algebra/functions.pdf',
        fileType: 'application/pdf',
        fileSize: 312000,
        order: 2,
        accessType: 'INTERNAL',
        content: courseContent.algebra_functions,
      },
    ],
  },

  // ============ 4. MODERN LITERATURE ============
  {
    title: 'Modern Literature',
    description: 'Explore literary analysis techniques, major literary movements, and Shakespeare. Develop critical reading and writing skills.',
    slug: 'modern-literature',
    category: 'HUMANITIES',
    visibility: 'PUBLIC',
    published: true,
    files: [
      {
        name: 'Literary Analysis Techniques',
        originalName: 'Literary_Analysis.pdf',
        fileName: 'literature_analysis.pdf',
        filePath: '/courses/literature/analysis.pdf',
        fileType: 'application/pdf',
        fileSize: 245000,
        order: 0,
        accessType: 'INTERNAL',
        content: courseContent.literature_analysis,
      },
      {
        name: 'Major Literary Movements',
        originalName: 'Literary_Movements.pdf',
        fileName: 'literature_movements.pdf',
        filePath: '/courses/literature/movements.pdf',
        fileType: 'application/pdf',
        fileSize: 298000,
        order: 1,
        accessType: 'INTERNAL',
        content: courseContent.literature_movements,
      },
      {
        name: 'Understanding Shakespeare',
        originalName: 'Shakespeare_Guide.pdf',
        fileName: 'literature_shakespeare.pdf',
        filePath: '/courses/literature/shakespeare.pdf',
        fileType: 'application/pdf',
        fileSize: 312000,
        order: 2,
        accessType: 'INTERNAL',
        content: courseContent.literature_shakespeare,
      },
    ],
  },

  // ============ 5. BIOLOGY BASICS ============
  {
    title: 'Biology Basics',
    description: 'Discover the fundamentals of life science including cell biology, genetics, and ecology. Perfect for students beginning their biology journey.',
    slug: 'biology-basics',
    category: 'SCIENCE',
    visibility: 'PUBLIC',
    published: true,
    files: [
      {
        name: 'Cell Biology Fundamentals',
        originalName: 'Cell_Biology.pdf',
        fileName: 'biology_cells.pdf',
        filePath: '/courses/biology/cells.pdf',
        fileType: 'application/pdf',
        fileSize: 356000,
        order: 0,
        accessType: 'INTERNAL',
        content: courseContent.biology_cells,
      },
      {
        name: 'Genetics and Heredity',
        originalName: 'Genetics.pdf',
        fileName: 'biology_genetics.pdf',
        filePath: '/courses/biology/genetics.pdf',
        fileType: 'application/pdf',
        fileSize: 378000,
        order: 1,
        accessType: 'INTERNAL',
        content: courseContent.biology_genetics,
      },
      {
        name: 'Ecology: Organisms and Environment',
        originalName: 'Ecology.pdf',
        fileName: 'biology_ecology.pdf',
        filePath: '/courses/biology/ecology.pdf',
        fileType: 'application/pdf',
        fileSize: 334000,
        order: 2,
        accessType: 'INTERNAL',
        content: courseContent.biology_ecology,
      },
    ],
  },
];

// ============================================================
// Seed Function
// ============================================================

async function seedCoursesWithInternalFiles(creatorId: string) {
  logger.info('🎓 Seeding courses with academic content...');

  let coursesCreated = 0;
  let filesCreated = 0;

  for (const courseData of coursesData) {
    const { files, ...courseInfo } = courseData;

    // Create the course with files
    const course = await prisma.course.create({
      data: {
        ...courseInfo,
        createdBy: creatorId,
        files: {
          create: files.map(({ content, ...fileData }) => fileData),
        },
      },
      include: { files: true },
    });

    coursesCreated++;

    // Create AI content for each file (with extracted text for AI processing)
    for (let i = 0; i < files.length; i++) {
      const file = course.files[i];
      const fileContent = files[i].content;

      await prisma.courseFileAI.create({
        data: {
          fileId: file.id,
          extractedText: fileContent,
        },
      });

      filesCreated++;
    }

    logger.info(`   ✓ ${course.title} (${files.length} files)`);
  }

  logger.info(`📚 Created ${coursesCreated} courses with ${filesCreated} files`);
}

export default seedCoursesWithInternalFiles;
