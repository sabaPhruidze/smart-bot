import {z} from 'zod';

const loginSchema = z.object({
    identifier:z.string(),
    password:z.string().min(6,{message:'Password is required'})
});

export type LoginFormValues = z.infer<typeof loginSchema>;