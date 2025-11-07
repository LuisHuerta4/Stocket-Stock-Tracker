'use server'

import { auth } from "../better-auth/auth";
import { inngest } from "../inngest/client";
import { headers } from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({
            body: { email, password, name: fullName }
        })

        if (response) {
            await inngest.send({
                name: 'app/user.created',
                data: {
                    email,
                    name: fullName,
                    country,
                    investmentGoals,
                    riskTolerance,
                    preferredIndustry
                }
            })
        }

        return { success: true, data: response };

    } catch (error) {
        console.error('Error during sign up:', error);
        return { success: false, message: 'Sign up failed. Please try again.' };
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({
            body: { email, password }
        })

        return { success: true, data: response };

    } catch (error) {
        console.error('Error during sign in:', error);
        return { success: false, message: 'Sign in failed. Please try again.' };
    }
}


export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (error) {
        console.log('Sign out failed', error);
        return { success: false, message: 'Sign out failed.' };
    }
}