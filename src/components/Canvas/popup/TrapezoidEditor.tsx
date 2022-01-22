import {
    Button,
    Checkbox,
    FormControlLabel,
    InputAdornment,
    Paper,
    Stack,
    TextField,
} from '@mui/material';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { isTrapezoid, Trapezoid } from '../../../types/shape';
import { round } from '../util';
import { PopupBaseProps } from './types';

type Props = PopupBaseProps;

interface FormProps extends Omit<Props, 'values'> {
    trapezoid: Trapezoid;
}

interface TrapezoidAttrs {
    forceI: number;
    forceJ: number;
    angle: number;
    isGlobal: boolean;
}
interface FormValues {
    forceI: string;
    forceJ: string;
    angle: string;
    isGlobal: boolean;
}

type ValidateTuple = [value: number, valid: boolean, error: string];

/**
 * 必須かつ 0以上の数値
 * @param value
 */
const validateForce = (value: string): ValidateTuple => {
    if (value.length === 0) {
        // 必須
        return [NaN, false, '数値を入力してください'];
    } else {
        const val = parseFloat(value);
        if (isNaN(val)) {
            // 数値でない
            return [NaN, false, '数値を入力してください'];
        } else if (0 >= val && val > Number.MAX_SAFE_INTEGER) {
            // 数値が範囲外
            return [val, false, '0 以上の数値を入力してください'];
        }
        // OK
        return [round(val, 3), true, ''];
    }
};

/**
 * -180 から 180 の範囲の数値
 * -180 の場合は 180 とする
 * @param value
 */
const validateAngle = (value: string): ValidateTuple => {
    if (value.length > 0) {
        let val = parseInt(value, 10);
        if (isNaN(val) || value.indexOf('.') >= 0) {
            // 整数でない
            return [NaN, false, '整数を入力してください'];
        } else if (-180 > val || 180 < val) {
            // 180 から 180 の範囲外
            return [val, false, '-180 〜 180 で入力してください'];
        }
        if (val === -180) {
            // -180 の場合は 180 とする
            val = 180;
        }
        // OK
        return [val, true, ''];
    }
    // 未指定の場合は 90 を返す
    return [90, true, ''];
};

const parseFormValues = (values: Partial<FormValues>): [boolean, TrapezoidAttrs] => {
    const attrs: TrapezoidAttrs = {
        forceI: 0,
        forceJ: 0,
        angle: 90,
        isGlobal: false,
    };

    // forceI
    const [value1, valid1] = validateForce(values.forceI ?? '');
    const [value2, valid2] = validateForce(values.forceJ ?? '');
    const [value3, valid3] = validateAngle(values.angle ?? '');
    const valid = valid1 && valid2 && valid3;

    attrs.forceI = value1;
    attrs.forceJ = value2;
    attrs.angle = value3;
    attrs.isGlobal = values.isGlobal ?? false;

    return [valid, attrs];
};

const toFormValues = (trapezoid: Trapezoid): Partial<FormValues> => {
    const values: Partial<FormValues> = {};

    values.forceI = `${trapezoid.forceI}`;
    values.forceJ = `${trapezoid.forceJ}`;
    values.angle = `${trapezoid.angle ?? ''}`;
    values.isGlobal = trapezoid.isGlobal;

    return values;
};

const TrapezoidEditor: React.VFC<FormProps> = ({ trapezoid, onChange, onClose }) => {
    const [values, setValues] = useState<Partial<FormValues>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (event.currentTarget.checkValidity()) {
                // エラーがあれば更新しない
                const invalid = Object.values(errors).some((error) => error.length > 0);
                if (!invalid) {
                    // values を TrapezoidAttrs に変換する
                    const [valid, attrs] = parseFormValues(values);
                    console.log(valid, attrs);
                    if (valid) {
                        // 更新
                        onChange &&
                            onChange({
                                ...trapezoid,
                                ...attrs,
                            });
                    }
                    // ポップアップ閉じる
                    onClose();
                }
            }
        },
        [errors, onChange, onClose, trapezoid, values]
    );

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        let errorMessage = '';
        switch (name) {
            case 'forceI':
            case 'forceJ':
                // 必須かつ 0以上の数値
                const [, valid1, error1] = validateForce(value);
                if (!valid1) {
                    errorMessage = error1;
                }
                break;
            case 'angle':
                const [, valid2, error2] = validateAngle(value);
                if (!valid2) {
                    errorMessage = error2;
                }
                break;
        }

        // エラー情報の更新
        setErrors((state) => ({
            ...state,
            [name]: errorMessage,
        }));

        // 値を更新
        setValues((state) => ({
            ...state,
            [name]: value,
        }));
    }, []);

    const handleChangeIsGlobal = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const { checked } = event.target;
        setValues((state) => ({
            ...state,
            isGlobal: checked,
        }));
    }, []);

    useEffect(() => {
        setValues(toFormValues(trapezoid));
        setErrors({});
    }, [trapezoid]);

    return (
        <Paper>
            <Stack
                direction="column"
                spacing={1}
                sx={{ p: 1, width: 240 }}
                component="form"
                autoComplete="off"
                noValidate
                onSubmit={handleSubmit}
            >
                {/* forceI */}
                <TextField
                    variant="outlined"
                    margin="dense"
                    size="small"
                    label="I端側の荷重"
                    name="forceI"
                    value={values['forceI'] ?? ''}
                    required
                    fullWidth
                    onChange={handleChange}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">kN/m</InputAdornment>,
                    }}
                    error={Boolean(errors['forceI'])}
                    helperText={errors['forceI'] ?? ''}
                />
                {/* forceJ */}
                <TextField
                    variant="outlined"
                    margin="dense"
                    size="small"
                    label="J端側の荷重"
                    name="forceJ"
                    value={values['forceJ'] ?? ''}
                    required
                    fullWidth
                    onChange={handleChange}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">kN/m</InputAdornment>,
                    }}
                    error={Boolean(errors['forceJ'])}
                    helperText={errors['forceJ'] ?? ''}
                />
                {/* angle */}
                <TextField
                    variant="outlined"
                    margin="dense"
                    size="small"
                    label="角度"
                    name="angle"
                    value={values['angle'] ?? ''}
                    fullWidth
                    onChange={handleChange}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">°</InputAdornment>,
                    }}
                    error={Boolean(errors['angle'])}
                    helperText={errors['angle'] ?? ''}
                />
                {/* isGlobal */}
                <FormControlLabel
                    label="全体座標系"
                    control={
                        <Checkbox
                            name="isGlobal"
                            size="small"
                            checked={values.isGlobal ?? false}
                            onChange={handleChangeIsGlobal}
                        />
                    }
                />
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <Button size="small" onClick={onClose}>
                        キャンセル
                    </Button>
                    <Button type="submit" size="small" variant="contained">
                        OK
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
};

const ConnectedTrapezoidEditor: React.VFC<Props> = ({ values, ...props }) => {
    const trapezoid = useMemo(() => {
        if (isTrapezoid(values)) {
            return values;
        }
        // 空データを返す
        return {
            id: '',
            name: '',
            beam: '',
            forceI: 0,
            distanceI: 0,
            forceJ: 0,
            distanceJ: 0,
        };
    }, [values]);

    return <TrapezoidEditor {...props} trapezoid={trapezoid} />;
};

export default ConnectedTrapezoidEditor;
