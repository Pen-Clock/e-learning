// scripts/seed.ts
import { db } from "../lib/db";
import { courses, coursePages, pageSections } from "../lib/db/schema";
import { generateId } from "../lib/utils";

async function seed() {
  console.log("Seeding database...");

  // Create a sample course
  const courseId = generateId();
  await db.insert(courses).values({
    id: courseId,
    title: "JavaScript Fundamentals",
    description:
      "Learn the basics of JavaScript programming with interactive lessons and coding challenges.",
    price: 0,
    isPublished: true,
  });

  // Create pages
  const page1Id = generateId();
  await db.insert(coursePages).values({
    id: page1Id,
    courseId,
    title: "Introduction to Variables",
    orderIndex: 0,
  });

  // Add sections to page 1
  await db.insert(pageSections).values([
    {
      id: generateId(),
      pageId: page1Id,
      type: "text",
      orderIndex: 0,
      content: {
        html: "<h2>What are Variables?</h2><p>Variables are containers for storing data values. In JavaScript, you can declare variables using <code>let</code>, <code>const</code>, or <code>var</code>.</p><h3>Example:</h3><pre><code>let name = 'John';\nconst age = 30;\nvar city = 'New York';</code></pre>",
      },
    },
    {
      id: generateId(),
      pageId: page1Id,
      type: "mcq",
      orderIndex: 1,
      content: {
        question: "Which keyword creates a variable that cannot be reassigned?",
        options: [
          { id: "1", text: "let", isCorrect: false },
          { id: "2", text: "const", isCorrect: true },
          { id: "3", text: "var", isCorrect: false },
        ],
        explanation:
          "The const keyword creates a constant variable that cannot be reassigned after initialization.",
      },
    },
    {
      id: generateId(),
      pageId: page1Id,
      type: "code",
      orderIndex: 2,
      content: {
        title: "Create a Variable",
        description:
          "Write a function that returns the value of a variable named 'message' with the text 'Hello World'.",
        starterCode:
          "function solution() {\n  // Create a variable called message\n  // Return the message\n}",
        language: "javascript",
        testCases: [
          { input: "", expectedOutput: "Hello World", hidden: false },
        ],
      },
    },
  ]);

  const page2Id = generateId();
  await db.insert(coursePages).values({
    id: page2Id,
    courseId,
    title: "Working with Numbers",
    orderIndex: 1,
  });

  await db.insert(pageSections).values([
    {
      id: generateId(),
      pageId: page2Id,
      type: "text",
      orderIndex: 0,
      content: {
        html: "<h2>Numbers in JavaScript</h2><p>JavaScript has only one type of number. Numbers can be written with or without decimals.</p><pre><code>let x = 10;\nlet y = 3.14;\nlet z = x + y;</code></pre>",
      },
    },
    {
      id: generateId(),
      pageId: page2Id,
      type: "code",
      orderIndex: 1,
      content: {
        title: "Add Two Numbers",
        description: "Write a function that takes a number and returns that number plus 5.",
        starterCode: "function solution(input) {\n  // Your code here\n}",
        language: "javascript",
        testCases: [
          { input: "5", expectedOutput: "10", hidden: false },
          { input: "0", expectedOutput: "5", hidden: false },
        ],
      },
    },
  ]);

  console.log("Database seeded successfully!");
}

seed().catch(console.error);