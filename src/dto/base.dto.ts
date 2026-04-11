import { Optional } from '@nestjs/common';

export class BaseDto {
    private skipValue: number = 0;
    private takeValue: number = 10;

    get skip() {
        return this.skipValue;
    }

    get take() {
        return this.takeValue;
    }

    set skip(value: number) {
        this.skipValue = value;
    }

    set take(value: number) {
        if (value > 100) {
            this.takeValue = 100;
        }

        this.takeValue = value;
    }

    @Optional()
    public user?: number;

    @Optional()
    public status?: 'A' | 'I';

    @Optional()
    public field?: string;

    @Optional()
    public value_field?: string;

    @Optional()
    public id?: number;

}
