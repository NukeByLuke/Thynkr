import prisma from './client';
import { logger } from '../lib/logger';

async function seedCourses() {
  try {
    logger.info('Starting course seed...');

    // Get the premium user to be the course creator
    const premiumUser = await prisma.user.findUnique({
      where: { email: 'premium@thynkr.ca' },
    });

    if (!premiumUser) {
      logger.error('Premium user (premium@thynkr.ca) not found. Run main seed first.');
      return;
    }

    const mathCourses = [
      {
        title: 'Calculus Essentials',
        description: 'Master derivatives, integrals, and limits with AI-generated examples.',
        slug: 'calculus-essentials',
        category: 'MATHEMATICS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Derivatives Notes',
            originalName: 'Derivatives_Notes.pdf',
            fileName: 'derivatives_notes.pdf',
            filePath: 'courses/sample/derivatives_notes.pdf',
            fileType: 'application/pdf',
            fileSize: 245000,
            order: 0,
          },
          {
            name: 'Integration Practice',
            originalName: 'Integration_Practice.pdf',
            fileName: 'integration_practice.pdf',
            filePath: 'courses/sample/integration_practice.pdf',
            fileType: 'application/pdf',
            fileSize: 312000,
            order: 1,
          },
        ],
      },
      {
        title: 'Algebra Foundations',
        description: 'Learn the core rules of algebra, linear equations, and factoring.',
        slug: 'algebra-foundations',
        category: 'MATHEMATICS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Equations Worksheet',
            originalName: 'Equations_Worksheet.pdf',
            fileName: 'equations_worksheet.pdf',
            filePath: 'courses/sample/equations_worksheet.pdf',
            fileType: 'application/pdf',
            fileSize: 189000,
            order: 0,
          },
          {
            name: 'Factoring Guide',
            originalName: 'Factoring_Guide.pdf',
            fileName: 'factoring_guide.pdf',
            filePath: 'courses/sample/factoring_guide.pdf',
            fileType: 'application/pdf',
            fileSize: 156000,
            order: 1,
          },
        ],
      },
      {
        title: 'Statistics for Beginners',
        description: 'Understand probability, data visualization, and hypothesis testing.',
        slug: 'statistics-for-beginners',
        category: 'MATHEMATICS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Probability Basics',
            originalName: 'ProbabilityBasics.pdf',
            fileName: 'probability_basics.pdf',
            filePath: 'courses/sample/probability_basics.pdf',
            fileType: 'application/pdf',
            fileSize: 278000,
            order: 0,
          },
          {
            name: 'Data Graphs',
            originalName: 'DataGraphs.docx',
            fileName: 'data_graphs.docx',
            filePath: 'courses/sample/data_graphs.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 134000,
            order: 1,
          },
        ],
      },
      // Science Courses
      {
        title: 'Introduction to Biology',
        description: 'Explore cell structures, DNA, and genetics using interactive notes.',
        slug: 'introduction-to-biology',
        category: 'SCIENCE' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Cells and DNA',
            originalName: 'Cells_and_DNA.pdf',
            fileName: 'cells_and_dna.pdf',
            filePath: 'courses/sample/cells_and_dna.pdf',
            fileType: 'application/pdf',
            fileSize: 352000,
            order: 0,
          },
          {
            name: 'Genetics Overview',
            originalName: 'Genetics_Overview.docx',
            fileName: 'genetics_overview.docx',
            filePath: 'courses/sample/genetics_overview.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 198000,
            order: 1,
          },
        ],
      },
      {
        title: 'Physics Fundamentals',
        description: 'Learn forces, motion, and energy with clear summaries and problems.',
        slug: 'physics-fundamentals',
        category: 'SCIENCE' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Forces Laws',
            originalName: 'Forces_Laws.pdf',
            fileName: 'forces_laws.pdf',
            filePath: 'courses/sample/forces_laws.pdf',
            fileType: 'application/pdf',
            fileSize: 287000,
            order: 0,
          },
          {
            name: 'Kinetic Energy Exercises',
            originalName: 'KineticEnergy_Exercises.pdf',
            fileName: 'kinetic_energy_exercises.pdf',
            filePath: 'courses/sample/kinetic_energy_exercises.pdf',
            fileType: 'application/pdf',
            fileSize: 215000,
            order: 1,
          },
        ],
      },
      {
        title: 'Chemistry Made Simple',
        description: 'Discover atoms, bonds, and chemical reactions.',
        slug: 'chemistry-made-simple',
        category: 'SCIENCE' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Periodic Table',
            originalName: 'Periodic_Table.pdf',
            fileName: 'periodic_table.pdf',
            filePath: 'courses/sample/periodic_table.pdf',
            fileType: 'application/pdf',
            fileSize: 176000,
            order: 0,
          },
          {
            name: 'Chemical Reactions',
            originalName: 'Chemical_Reactions.docx',
            fileName: 'chemical_reactions.docx',
            filePath: 'courses/sample/chemical_reactions.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 223000,
            order: 1,
          },
        ],
      },
      // Technology Courses
      {
        title: 'Intro to Programming',
        description: 'Start coding with JavaScript, Python, and automation basics.',
        slug: 'intro-to-programming',
        category: 'TECHNOLOGY' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Python Basics',
            originalName: 'Python_Basics.pdf',
            fileName: 'python_basics.pdf',
            filePath: 'courses/sample/python_basics.pdf',
            fileType: 'application/pdf',
            fileSize: 412000,
            order: 0,
          },
          {
            name: 'JavaScript Intro',
            originalName: 'JavaScript_Intro.docx',
            fileName: 'javascript_intro.docx',
            filePath: 'courses/sample/javascript_intro.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 298000,
            order: 1,
          },
        ],
      },
      {
        title: 'Cybersecurity 101',
        description: 'Learn how to stay safe online and understand encryption principles.',
        slug: 'cybersecurity-101',
        category: 'TECHNOLOGY' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Encryption Basics',
            originalName: 'Encryption_Basics.pdf',
            fileName: 'encryption_basics.pdf',
            filePath: 'courses/sample/encryption_basics.pdf',
            fileType: 'application/pdf',
            fileSize: 267000,
            order: 0,
          },
          {
            name: 'Network Security Tips',
            originalName: 'Network_Security_Tips.pdf',
            fileName: 'network_security_tips.pdf',
            filePath: 'courses/sample/network_security_tips.pdf',
            fileType: 'application/pdf',
            fileSize: 189000,
            order: 1,
          },
        ],
      },
      // Engineering Courses
      {
        title: 'Mechanical Engineering Basics',
        description: 'Explore forces, materials, and design principles.',
        slug: 'mechanical-engineering-basics',
        category: 'ENGINEERING' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Statics and Dynamics',
            originalName: 'Statics_and_Dynamics.pdf',
            fileName: 'statics_and_dynamics.pdf',
            filePath: 'courses/sample/statics_and_dynamics.pdf',
            fileType: 'application/pdf',
            fileSize: 385000,
            order: 0,
          },
          {
            name: 'Material Properties',
            originalName: 'Material_Properties.docx',
            fileName: 'material_properties.docx',
            filePath: 'courses/sample/material_properties.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 241000,
            order: 1,
          },
        ],
      },
      {
        title: 'Electrical Circuits',
        description: "Learn voltage, resistance, and Ohm's Law with interactive exercises.",
        slug: 'electrical-circuits',
        category: 'ENGINEERING' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Circuit Fundamentals',
            originalName: 'Circuit_Fundamentals.pdf',
            fileName: 'circuit_fundamentals.pdf',
            filePath: 'courses/sample/circuit_fundamentals.pdf',
            fileType: 'application/pdf',
            fileSize: 312000,
            order: 0,
          },
          {
            name: 'Ohms Law Calculations',
            originalName: 'OhmsLaw_Calculations.pdf',
            fileName: 'ohms_law_calculations.pdf',
            filePath: 'courses/sample/ohms_law_calculations.pdf',
            fileType: 'application/pdf',
            fileSize: 198000,
            order: 1,
          },
        ],
      },
      // Language Courses
      {
        title: 'Spanish for Beginners',
        description: 'Basic grammar, pronunciation, and vocabulary essentials.',
        slug: 'spanish-for-beginners',
        category: 'LANGUAGES' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Greetings',
            originalName: 'Greetings.pdf',
            fileName: 'greetings.pdf',
            filePath: 'courses/sample/greetings.pdf',
            fileType: 'application/pdf',
            fileSize: 156000,
            order: 0,
          },
          {
            name: 'Verb Conjugations',
            originalName: 'Verb_Conjugations.docx',
            fileName: 'verb_conjugations.docx',
            filePath: 'courses/sample/verb_conjugations.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 198000,
            order: 1,
          },
        ],
      },
      {
        title: 'French Conversation Skills',
        description: 'Practice dialogue and comprehension with AI flashcards.',
        slug: 'french-conversation-skills',
        category: 'LANGUAGES' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Everyday Phrases',
            originalName: 'Everyday_Phrases.pdf',
            fileName: 'everyday_phrases.pdf',
            filePath: 'courses/sample/everyday_phrases.pdf',
            fileType: 'application/pdf',
            fileSize: 187000,
            order: 0,
          },
          {
            name: 'Grammar Tips',
            originalName: 'Grammar_Tips.pdf',
            fileName: 'grammar_tips.pdf',
            filePath: 'courses/sample/grammar_tips.pdf',
            fileType: 'application/pdf',
            fileSize: 142000,
            order: 1,
          },
        ],
      },
      // Humanities Courses
      {
        title: 'World History Overview',
        description: 'A timeline of major civilizations and revolutions.',
        slug: 'world-history-overview',
        category: 'HUMANITIES' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Ancient History',
            originalName: 'AncientHistory.pdf',
            fileName: 'ancient_history.pdf',
            filePath: 'courses/sample/ancient_history.pdf',
            fileType: 'application/pdf',
            fileSize: 423000,
            order: 0,
          },
          {
            name: 'Modern Era',
            originalName: 'ModernEra.docx',
            fileName: 'modern_era.docx',
            filePath: 'courses/sample/modern_era.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 312000,
            order: 1,
          },
        ],
      },
      {
        title: 'Philosophy 101',
        description: 'Study ethics, logic, and metaphysics through classic texts.',
        slug: 'philosophy-101',
        category: 'HUMANITIES' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Ethics and Logic',
            originalName: 'Ethics_and_Logic.pdf',
            fileName: 'ethics_and_logic.pdf',
            filePath: 'courses/sample/ethics_and_logic.pdf',
            fileType: 'application/pdf',
            fileSize: 287000,
            order: 0,
          },
          {
            name: 'Philosophers Summary',
            originalName: 'Philosophers_Summary.pdf',
            fileName: 'philosophers_summary.pdf',
            filePath: 'courses/sample/philosophers_summary.pdf',
            fileType: 'application/pdf',
            fileSize: 215000,
            order: 1,
          },
        ],
      },
      // Business Courses
      {
        title: 'Entrepreneurship Fundamentals',
        description: 'From idea to launch — business models and strategy.',
        slug: 'entrepreneurship-fundamentals',
        category: 'BUSINESS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Business Plan Template',
            originalName: 'Business_Plan_Template.docx',
            fileName: 'business_plan_template.docx',
            filePath: 'courses/sample/business_plan_template.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 267000,
            order: 0,
          },
          {
            name: 'Startup Finance',
            originalName: 'Startup_Finance.pdf',
            fileName: 'startup_finance.pdf',
            filePath: 'courses/sample/startup_finance.pdf',
            fileType: 'application/pdf',
            fileSize: 342000,
            order: 1,
          },
        ],
      },
      {
        title: 'Marketing Principles',
        description: 'Learn branding, digital marketing, and analytics.',
        slug: 'marketing-principles',
        category: 'BUSINESS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'SEO Basics',
            originalName: 'SEO_Basics.pdf',
            fileName: 'seo_basics.pdf',
            filePath: 'courses/sample/seo_basics.pdf',
            fileType: 'application/pdf',
            fileSize: 198000,
            order: 0,
          },
          {
            name: 'Social Media Strategies',
            originalName: 'SocialMedia_Strategies.pdf',
            fileName: 'social_media_strategies.pdf',
            filePath: 'courses/sample/social_media_strategies.pdf',
            fileType: 'application/pdf',
            fileSize: 256000,
            order: 1,
          },
        ],
      },
      // Arts Courses
      {
        title: 'Digital Illustration',
        description: 'Master digital sketching, layers, and shading techniques.',
        slug: 'digital-illustration',
        category: 'ARTS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Brush Techniques',
            originalName: 'Brush_Techniques.pdf',
            fileName: 'brush_techniques.pdf',
            filePath: 'courses/sample/brush_techniques.pdf',
            fileType: 'application/pdf',
            fileSize: 312000,
            order: 0,
          },
          {
            name: 'Color Theory',
            originalName: 'ColorTheory.docx',
            fileName: 'color_theory.docx',
            filePath: 'courses/sample/color_theory.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 187000,
            order: 1,
          },
        ],
      },
      {
        title: 'Music Theory Basics',
        description: 'Scales, chords, and composition fundamentals.',
        slug: 'music-theory-basics',
        category: 'ARTS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Chord Progressions',
            originalName: 'Chord_Progressions.pdf',
            fileName: 'chord_progressions.pdf',
            filePath: 'courses/sample/chord_progressions.pdf',
            fileType: 'application/pdf',
            fileSize: 234000,
            order: 0,
          },
          {
            name: 'Notation Guide',
            originalName: 'Notation_Guide.pdf',
            fileName: 'notation_guide.pdf',
            filePath: 'courses/sample/notation_guide.pdf',
            fileType: 'application/pdf',
            fileSize: 189000,
            order: 1,
          },
        ],
      },
      // Health Courses
      {
        title: 'Nutrition & Wellness',
        description: 'Understand balanced diets, micronutrients, and meal planning.',
        slug: 'nutrition-and-wellness',
        category: 'HEALTH' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Nutrition Basics',
            originalName: 'Nutrition_Basics.pdf',
            fileName: 'nutrition_basics.pdf',
            filePath: 'courses/sample/nutrition_basics.pdf',
            fileType: 'application/pdf',
            fileSize: 287000,
            order: 0,
          },
          {
            name: 'Meal Plan Templates',
            originalName: 'Meal_Plan_Templates.pdf',
            fileName: 'meal_plan_templates.pdf',
            filePath: 'courses/sample/meal_plan_templates.pdf',
            fileType: 'application/pdf',
            fileSize: 198000,
            order: 1,
          },
        ],
      },
      {
        title: 'Anatomy 101',
        description: 'Explore human body systems and medical terminology.',
        slug: 'anatomy-101',
        category: 'HEALTH' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Body Systems',
            originalName: 'Body_Systems.pdf',
            fileName: 'body_systems.pdf',
            filePath: 'courses/sample/body_systems.pdf',
            fileType: 'application/pdf',
            fileSize: 456000,
            order: 0,
          },
          {
            name: 'Terminology Guide',
            originalName: 'Terminology_Guide.pdf',
            fileName: 'terminology_guide.pdf',
            filePath: 'courses/sample/terminology_guide.pdf',
            fileType: 'application/pdf',
            fileSize: 234000,
            order: 1,
          },
        ],
      },
      // Law Courses
      {
        title: 'Introduction to Criminal Law',
        description: 'Foundations of justice, crime, and punishment.',
        slug: 'introduction-to-criminal-law',
        category: 'LAW' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Criminal Law Overview',
            originalName: 'Criminal_Law_Overview.pdf',
            fileName: 'criminal_law_overview.pdf',
            filePath: 'courses/sample/criminal_law_overview.pdf',
            fileType: 'application/pdf',
            fileSize: 378000,
            order: 0,
          },
          {
            name: 'Case Studies',
            originalName: 'Case_Studies.docx',
            fileName: 'case_studies.docx',
            filePath: 'courses/sample/case_studies.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 267000,
            order: 1,
          },
        ],
      },
      {
        title: 'Business Law Essentials',
        description: 'Contracts, liability, and corporate structure simplified.',
        slug: 'business-law-essentials',
        category: 'LAW' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Contract Law',
            originalName: 'Contract_Law.pdf',
            fileName: 'contract_law.pdf',
            filePath: 'courses/sample/contract_law.pdf',
            fileType: 'application/pdf',
            fileSize: 312000,
            order: 0,
          },
          {
            name: 'Company Formation',
            originalName: 'Company_Formation.pdf',
            fileName: 'company_formation.pdf',
            filePath: 'courses/sample/company_formation.pdf',
            fileType: 'application/pdf',
            fileSize: 245000,
            order: 1,
          },
        ],
      },
      // Miscellaneous / Other Courses
      {
        title: 'Personal Finance',
        description: 'Budgeting, credit management, and financial planning.',
        slug: 'personal-finance',
        category: 'OTHER' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Budget Planner',
            originalName: 'Budget_Planner.pdf',
            fileName: 'budget_planner.pdf',
            filePath: 'courses/sample/budget_planner.pdf',
            fileType: 'application/pdf',
            fileSize: 198000,
            order: 0,
          },
          {
            name: 'Credit Tips',
            originalName: 'Credit_Tips.pdf',
            fileName: 'credit_tips.pdf',
            filePath: 'courses/sample/credit_tips.pdf',
            fileType: 'application/pdf',
            fileSize: 156000,
            order: 1,
          },
        ],
      },
      {
        title: 'Public Speaking',
        description: 'Overcome stage fright and build persuasive communication skills.',
        slug: 'public-speaking',
        category: 'OTHER' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        files: [
          {
            name: 'Speech Tips',
            originalName: 'Speech_Tips.pdf',
            fileName: 'speech_tips.pdf',
            filePath: 'courses/sample/speech_tips.pdf',
            fileType: 'application/pdf',
            fileSize: 178000,
            order: 0,
          },
          {
            name: 'Presentation Exercises',
            originalName: 'Presentation_Exercises.docx',
            fileName: 'presentation_exercises.docx',
            filePath: 'courses/sample/presentation_exercises.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 145000,
            order: 1,
          },
        ],
      },
    ];

    for (const courseData of mathCourses) {
      const { files, ...courseInfo } = courseData;

      // Check if course already exists
      const existingCourse = await prisma.course.findUnique({
        where: { slug: courseInfo.slug },
      });

      if (!existingCourse) {
        const course = await prisma.course.create({
          data: {
            ...courseInfo,
            files: {
              create: files,
            },
          },
        });
        logger.info(`Created course: ${course.title} with ${files.length} files`);
      } else {
        logger.info(`Course already exists: ${courseInfo.title}`);
      }
    }

    logger.info('✅ Course seed completed successfully');
  } catch (error) {
    logger.error('❌ Course seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCourses();
