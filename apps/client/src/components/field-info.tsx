import { FieldApi, ValidationError } from "@tanstack/react-form";

export function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
    return (
        <>
            {field.state.meta.isTouched && field.state.meta.errors.length ? (
                <span className='text-red-500 text-xs font-light'>{field.state.meta.errors[0]}</span>
            ) : null}
        </>
    )
}

export function FormError({ errors }: { errors: ValidationError[] }) {
    return (
        <span className='text-red-500 text-xs font-light'>{errors[0]}</span>
    )
}