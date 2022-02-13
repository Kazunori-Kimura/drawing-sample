import { Button, InputAdornment, Paper, Stack, TextField } from '@mui/material';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { isMoment, Moment } from '../../../types/shape';
import { PopupBaseProps } from './types';

type Props = PopupBaseProps;

interface MomentEditorProps extends Omit<Props, 'values'> {
    moment: Moment;
}

const MomentEditor: React.VFC<MomentEditorProps> = ({ moment, onChange, onClose }) => {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string>();

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (event.currentTarget.checkValidity() && typeof error === 'undefined') {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    // 更新
                    onChange &&
                        onChange({
                            ...moment,
                            moment: num,
                        });
                    // ポップアップ閉じる
                    onClose();
                }
            }
        },
        [error, value, onChange, moment, onClose]
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

        setError(errorMessage);
    }, []);

    useEffect(() => {
        setValue(`${moment.moment}`);
        setError(undefined);
    }, [moment]);

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
                    label="モーメント荷重"
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

const ConnectedMomentEditor: React.VFC<Props> = ({ values, ...props }) => {
    const moment = useMemo(() => {
        if (isMoment(values)) {
            return values;
        }
        // 空の moment を渡す
        return {
            id: '',
            name: '',
            beam: '',
            moment: 0,
            distanceI: 0,
        };
    }, [values]);

    return <MomentEditor {...props} moment={moment} />;
};

export default ConnectedMomentEditor;
