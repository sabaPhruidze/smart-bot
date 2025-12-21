import {z} from 'zod';
const US_PHONE_REGEX = /^\d{3}-\d{3}-\d{4}$/;

export const loginSchema = z.object({
    identifier:z.string().min(1,"Email or phone is required").refine((val) => z.string().email().safeParse(val).success || US_PHONE_REGEX.test(val),
      'Enter a valid email or phone (e.g., 444-444-4444).'),
    password:z.string().min(6,{message:'Password is required'})
});

export type LoginFormValues = z.infer<typeof loginSchema>;