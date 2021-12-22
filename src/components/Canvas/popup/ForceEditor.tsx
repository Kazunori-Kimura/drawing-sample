import { Button, InputAdornment, Paper, Stack, TextField } from '@mui/material';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Force, isForce } from '../../../types/shape';
import { PopupParams } from './types';

interface Props {
    values: PopupParams;
    onClose: VoidFunction;
    onChange: (force: Force) => void;
}

interface ForceEditorProps extends Omit<Props, 'values'> {
    force: Force;
}

const ForceEditor: React.VFC<ForceEditorProps> = ({ force, onChange, onClose }) => {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string>();

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (event.currentTarget.checkValidity() && typeof error === 'undefined') {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    // 更新
                    onChange({
                        ...force,
                        force: num,
                    });
                    // ポップアップ閉じる
                    onClose();
                }
            }
        },
        [error, onChange, onClose, value, force]
    );

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.currentTarget;
        let errorMessage: string | undefined;
        setValue(value);

        // 必須
        if (value.length === 0) {
            errorMessage = '数値を入力してください';
        }
        // 数値？
        const num = parseFloat(value);
        if (isNaN(num)) {
            errorMessage = '数値を入力してください';
        }
        if (0 > num || num > Number.MAX_SAFE_INTEGER) {
            errorMessage = '0 より大きい値を入力してください';
        }

        setError(errorMessage);
    }, []);

    useEffect(() => {
        setValue(`${force.force}`);
        setError(undefined);
    }, [force]);

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
                <TextField
                    variant="outlined"
                    margin="dense"
                    size="small"
                    label="集中荷重"
                    value={value}
                    required
                    fullWidth
                    onChange={handleChange}
                    InputProps={{
                        endAdornment: <InputAdornment position="end">kN</InputAdornment>,
                    }}
                    error={Boolean(error)}
                    helperText={error}
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

const ConnectedForceEditor: React.VFC<Props> = ({ values, ...props }) => {
    const force = useMemo(() => {
        if (isForce(values)) {
            return values;
        }
        // 空の force を渡す
        return {
            id: '',
            name: '',
            beam: '',
            force: 0,
            distanceI: 0,
        };
    }, [values]);

    return <ForceEditor {...props} force={force} />;
};

export default ConnectedForceEditor;
