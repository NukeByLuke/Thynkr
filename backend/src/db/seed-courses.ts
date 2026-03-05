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

    const officialCourses = [
      // MATHEMATICS
      {
        title: 'Advanced Calculus & Linear Algebra',
        description: 'Master multivariable calculus, vector spaces, and eigenvalues. Perfect for engineering and physics students preparing for advanced mathematics courses with real-world applications.',
        slug: 'advanced-calculus-linear-algebra',
        category: 'MATHEMATICS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'Calculus Lecture Notes',
            originalName: 'Calculus_Lecture_Notes.pdf',
            fileName: 'calculus_lecture_notes.pdf',
            filePath: 'courses/sample/calculus_lecture_notes.pdf',
            fileType: 'application/pdf',
            fileSize: 1245000,
            order: 0,
          },
          {
            name: 'Linear Algebra Problem Sets',
            originalName: 'Linear_Algebra_Problem_Sets.pdf',
            fileName: 'linear_algebra_problem_sets.pdf',
            filePath: 'courses/sample/linear_algebra_problem_sets.pdf',
            fileType: 'application/pdf',
            fileSize: 892000,
            order: 1,
          },
          {
            name: 'Practice Exams',
            originalName: 'Practice_Exams.pdf',
            fileName: 'practice_exams.pdf',
            filePath: 'courses/sample/practice_exams.pdf',
            fileType: 'application/pdf',
            fileSize: 567000,
            order: 2,
          },
        ],
      },
      
      // SCIENCE
      {
        title: 'Molecular Biology Fundamentals',
        description: 'Dive deep into DNA replication, protein synthesis, and gene expression. This comprehensive course covers modern molecular techniques and CRISPR technology for aspiring biologists.',
        slug: 'molecular-biology-fundamentals',
        category: 'SCIENCE' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'DNA Structure & Replication',
            originalName: 'DNA_Structure_Replication.pdf',
            fileName: 'dna_structure_replication.pdf',
            filePath: 'courses/sample/dna_structure_replication.pdf',
            fileType: 'application/pdf',
            fileSize: 1567000,
            order: 0,
          },
          {
            name: 'Protein Synthesis Guide',
            originalName: 'Protein_Synthesis_Guide.pdf',
            fileName: 'protein_synthesis_guide.pdf',
            filePath: 'courses/sample/protein_synthesis_guide.pdf',
            fileType: 'application/pdf',
            fileSize: 1123000,
            order: 1,
          },
          {
            name: 'CRISPR Technology Overview',
            originalName: 'CRISPR_Technology_Overview.docx',
            fileName: 'crispr_technology_overview.docx',
            filePath: 'courses/sample/crispr_technology_overview.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 734000,
            order: 2,
          },
        ],
      },

      // TECHNOLOGY
      {
        title: 'Full Stack Web Development 2025',
        description: 'Build modern web applications with React, Node.js, and TypeScript. Learn industry best practices, testing strategies, and deployment workflows used by top tech companies.',
        slug: 'full-stack-web-development-2025',
        category: 'TECHNOLOGY' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'React & TypeScript Fundamentals',
            originalName: 'React_TypeScript_Fundamentals.pdf',
            fileName: 'react_typescript_fundamentals.pdf',
            filePath: 'courses/sample/react_typescript_fundamentals.pdf',
            fileType: 'application/pdf',
            fileSize: 2134000,
            order: 0,
          },
          {
            name: 'Node.js Backend Architecture',
            originalName: 'NodeJS_Backend_Architecture.pdf',
            fileName: 'nodejs_backend_architecture.pdf',
            filePath: 'courses/sample/nodejs_backend_architecture.pdf',
            fileType: 'application/pdf',
            fileSize: 1876000,
            order: 1,
          },
          {
            name: 'Deployment & DevOps',
            originalName: 'Deployment_DevOps.pdf',
            fileName: 'deployment_devops.pdf',
            filePath: 'courses/sample/deployment_devops.pdf',
            fileType: 'application/pdf',
            fileSize: 1234000,
            order: 2,
          },
        ],
      },

      // ENGINEERING
      {
        title: 'Civil Engineering: Structural Analysis',
        description: 'Learn structural mechanics, load calculations, and design principles. This course covers beam theory, truss analysis, and modern computational methods for structural engineers.',
        slug: 'civil-engineering-structural-analysis',
        category: 'ENGINEERING' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'Structural Mechanics Theory',
            originalName: 'Structural_Mechanics_Theory.pdf',
            fileName: 'structural_mechanics_theory.pdf',
            filePath: 'courses/sample/structural_mechanics_theory.pdf',
            fileType: 'application/pdf',
            fileSize: 1945000,
            order: 0,
          },
          {
            name: 'Load Calculations & Safety',
            originalName: 'Load_Calculations_Safety.pdf',
            fileName: 'load_calculations_safety.pdf',
            filePath: 'courses/sample/load_calculations_safety.pdf',
            fileType: 'application/pdf',
            fileSize: 1456000,
            order: 1,
          },
          {
            name: 'Design Examples',
            originalName: 'Design_Examples.pdf',
            fileName: 'design_examples.pdf',
            filePath: 'courses/sample/design_examples.pdf',
            fileType: 'application/pdf',
            fileSize: 2123000,
            order: 2,
          },
        ],
      },

      // LANGUAGES
      {
        title: 'Japanese N5 Vocabulary & Grammar',
        description: 'Master essential Japanese for beginners. Learn hiragana, katakana, and 800+ vocabulary words needed to pass the JLPT N5 exam with confidence and cultural context.',
        slug: 'japanese-n5-vocabulary-grammar',
        category: 'LANGUAGES' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'Hiragana & Katakana Guide',
            originalName: 'Hiragana_Katakana_Guide.pdf',
            fileName: 'hiragana_katakana_guide.pdf',
            filePath: 'courses/sample/hiragana_katakana_guide.pdf',
            fileType: 'application/pdf',
            fileSize: 987000,
            order: 0,
          },
          {
            name: 'N5 Vocabulary List',
            originalName: 'N5_Vocabulary_List.pdf',
            fileName: 'n5_vocabulary_list.pdf',
            filePath: 'courses/sample/n5_vocabulary_list.pdf',
            fileType: 'application/pdf',
            fileSize: 1234000,
            order: 1,
          },
          {
            name: 'Grammar Patterns',
            originalName: 'Grammar_Patterns.pdf',
            fileName: 'grammar_patterns.pdf',
            filePath: 'courses/sample/grammar_patterns.pdf',
            fileType: 'application/pdf',
            fileSize: 876000,
            order: 2,
          },
        ],
      },

      // HUMANITIES
      {
        title: 'Modern European History',
        description: 'Explore European history from the Renaissance to the present day. Analyze key political movements, cultural shifts, and the impact of wars that shaped the modern world.',
        slug: 'modern-european-history',
        category: 'HUMANITIES' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1520452112805-c6692c840af0?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1520452112805-c6692c840af0?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'Renaissance to Enlightenment',
            originalName: 'Renaissance_to_Enlightenment.pdf',
            fileName: 'renaissance_to_enlightenment.pdf',
            filePath: 'courses/sample/renaissance_to_enlightenment.pdf',
            fileType: 'application/pdf',
            fileSize: 1678000,
            order: 0,
          },
          {
            name: 'World Wars & Aftermath',
            originalName: 'World_Wars_Aftermath.pdf',
            fileName: 'world_wars_aftermath.pdf',
            filePath: 'courses/sample/world_wars_aftermath.pdf',
            fileType: 'application/pdf',
            fileSize: 1987000,
            order: 1,
          },
          {
            name: 'Contemporary Europe',
            originalName: 'Contemporary_Europe.pdf',
            fileName: 'contemporary_europe.pdf',
            filePath: 'courses/sample/contemporary_europe.pdf',
            fileType: 'application/pdf',
            fileSize: 1345000,
            order: 2,
          },
        ],
      },

      // BUSINESS
      {
        title: 'MBA Essentials: Finance & Strategy',
        description: 'Accelerate your business career with core MBA concepts. Learn financial analysis, strategic planning, and leadership skills taught at top business schools worldwide.',
        slug: 'mba-essentials-finance-strategy',
        category: 'BUSINESS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'Financial Statement Analysis',
            originalName: 'Financial_Statement_Analysis.pdf',
            fileName: 'financial_statement_analysis.pdf',
            filePath: 'courses/sample/financial_statement_analysis.pdf',
            fileType: 'application/pdf',
            fileSize: 1567000,
            order: 0,
          },
          {
            name: 'Strategic Management',
            originalName: 'Strategic_Management.pdf',
            fileName: 'strategic_management.pdf',
            filePath: 'courses/sample/strategic_management.pdf',
            fileType: 'application/pdf',
            fileSize: 1789000,
            order: 1,
          },
          {
            name: 'Leadership & Organizational Behavior',
            originalName: 'Leadership_Organizational_Behavior.docx',
            fileName: 'leadership_organizational_behavior.docx',
            filePath: 'courses/sample/leadership_organizational_behavior.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 1234000,
            order: 2,
          },
        ],
      },

      // ARTS
      {
        title: 'Art History: Renaissance to Modern',
        description: 'Journey through 500 years of art history. Study masterpieces from Leonardo da Vinci to Picasso, understanding artistic movements, techniques, and cultural contexts.',
        slug: 'art-history-renaissance-to-modern',
        category: 'ARTS' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'Renaissance Masters',
            originalName: 'Renaissance_Masters.pdf',
            fileName: 'renaissance_masters.pdf',
            filePath: 'courses/sample/renaissance_masters.pdf',
            fileType: 'application/pdf',
            fileSize: 2134000,
            order: 0,
          },
          {
            name: 'Impressionism & Post-Impressionism',
            originalName: 'Impressionism_Post_Impressionism.pdf',
            fileName: 'impressionism_post_impressionism.pdf',
            filePath: 'courses/sample/impressionism_post_impressionism.pdf',
            fileType: 'application/pdf',
            fileSize: 1876000,
            order: 1,
          },
          {
            name: 'Modern Art Movements',
            originalName: 'Modern_Art_Movements.pdf',
            fileName: 'modern_art_movements.pdf',
            filePath: 'courses/sample/modern_art_movements.pdf',
            fileType: 'application/pdf',
            fileSize: 1654000,
            order: 2,
          },
        ],
      },

      // HEALTH
      {
        title: 'Human Anatomy & Physiology',
        description: 'Comprehensive study of the human body systems. Perfect for pre-med students, nurses, and health professionals learning anatomical structures and physiological processes.',
        slug: 'human-anatomy-physiology',
        category: 'HEALTH' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'Musculoskeletal System',
            originalName: 'Musculoskeletal_System.pdf',
            fileName: 'musculoskeletal_system.pdf',
            filePath: 'courses/sample/musculoskeletal_system.pdf',
            fileType: 'application/pdf',
            fileSize: 2345000,
            order: 0,
          },
          {
            name: 'Cardiovascular & Respiratory Systems',
            originalName: 'Cardiovascular_Respiratory_Systems.pdf',
            fileName: 'cardiovascular_respiratory_systems.pdf',
            filePath: 'courses/sample/cardiovascular_respiratory_systems.pdf',
            fileType: 'application/pdf',
            fileSize: 2123000,
            order: 1,
          },
          {
            name: 'Nervous & Endocrine Systems',
            originalName: 'Nervous_Endocrine_Systems.pdf',
            fileName: 'nervous_endocrine_systems.pdf',
            filePath: 'courses/sample/nervous_endocrine_systems.pdf',
            fileType: 'application/pdf',
            fileSize: 1987000,
            order: 2,
          },
        ],
      },

      // LAW
      {
        title: 'Introduction to Constitutional Law',
        description: 'Study the foundations of constitutional principles and civil rights. Analyze landmark Supreme Court cases and understand the balance of governmental powers in democratic societies.',
        slug: 'introduction-to-constitutional-law',
        category: 'LAW' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'Constitutional Foundations',
            originalName: 'Constitutional_Foundations.pdf',
            fileName: 'constitutional_foundations.pdf',
            filePath: 'courses/sample/constitutional_foundations.pdf',
            fileType: 'application/pdf',
            fileSize: 1678000,
            order: 0,
          },
          {
            name: 'Landmark Supreme Court Cases',
            originalName: 'Landmark_Supreme_Court_Cases.pdf',
            fileName: 'landmark_supreme_court_cases.pdf',
            filePath: 'courses/sample/landmark_supreme_court_cases.pdf',
            fileType: 'application/pdf',
            fileSize: 2234000,
            order: 1,
          },
          {
            name: 'Civil Rights & Liberties',
            originalName: 'Civil_Rights_Liberties.docx',
            fileName: 'civil_rights_liberties.docx',
            filePath: 'courses/sample/civil_rights_liberties.docx',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 1456000,
            order: 2,
          },
        ],
      },

      // OTHER
      {
        title: 'Personal Finance Mastery',
        description: 'Take control of your financial future. Learn budgeting, investing, tax strategies, and wealth building techniques from certified financial planners and successful investors.',
        slug: 'personal-finance-mastery',
        category: 'OTHER' as const,
        visibility: 'PUBLIC' as const,
        published: true,
        createdBy: premiumUser.id,
        coverImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=600&fit=crop',
        files: [
          {
            name: 'Budgeting & Expense Tracking',
            originalName: 'Budgeting_Expense_Tracking.pdf',
            fileName: 'budgeting_expense_tracking.pdf',
            filePath: 'courses/sample/budgeting_expense_tracking.pdf',
            fileType: 'application/pdf',
            fileSize: 987000,
            order: 0,
          },
          {
            name: 'Investment Strategies',
            originalName: 'Investment_Strategies.pdf',
            fileName: 'investment_strategies.pdf',
            filePath: 'courses/sample/investment_strategies.pdf',
            fileType: 'application/pdf',
            fileSize: 1456000,
            order: 1,
          },
          {
            name: 'Tax Planning & Retirement',
            originalName: 'Tax_Planning_Retirement.pdf',
            fileName: 'tax_planning_retirement.pdf',
            filePath: 'courses/sample/tax_planning_retirement.pdf',
            fileType: 'application/pdf',
            fileSize: 1234000,
            order: 2,
          },
        ],
      },
    ];

    for (const courseData of officialCourses) {
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
    logger.error({ err: error }, '❌ Course seed failed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCourses();
