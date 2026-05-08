export type CategoryOption = {
  id: string;
  label: string;
  type: "income" | "expense";
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: "52efe72b-9dc1-4ffe-bd61-0c329217830f",
    label: "Food",
    type: "expense",
  },
  {
    id: "ea2c1f60-50d3-4708-8f9c-58b4c6d0a2ea",
    label: "Transport",
    type: "expense",
  },
  {
    id: "cffbbfd3-7e44-4996-958b-fdae4dbae5cb",
    label: "Bills",
    type: "expense",
  },
  {
    id: "b4d8a0a4-0a28-4ed3-9f2c-70e5327e4c73",
    label: "Shopping",
    type: "expense",
  },
  {
    id: "b4d8a0a4-0a28-4ed3-9f2c-70e5327e4c72",
    label: "Others",
    type: "expense",
  },
  {
    id: "8c012f3f-7d78-4a4a-a4fe-84a32f51ddd7",
    label: "Sales",
    type: "income",
  },
  {
    id: "8c012f3f-7d78-4a4a-a4fe-84a32f51d6f7",
    label: "Salary",
    type: "income",
  },
  {
    id: "22b1ad96-13f0-4f92-9c6d-9da5cbe84f33",
    label: "Freelance",
    type: "income",
  },
  { id: "28c5c7d6-e9bf-4e4f-9cac-37f0233465b5", label: "Gift", type: "income" },
];
