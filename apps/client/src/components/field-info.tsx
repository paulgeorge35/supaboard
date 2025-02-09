import { FieldApi } from "@tanstack/react-form";

export function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
    return (
        <>
            {field.state.meta.isTouched && field.state.meta.errors.length ? (
                <span className='text-red-500 text-xs font-light'>{field.state.meta.errors.join(", ")}</span>
            ) : null}
        </>
    )
}