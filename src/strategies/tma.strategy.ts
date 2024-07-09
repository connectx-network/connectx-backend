import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { validate, parse, type InitDataParsed } from '@telegram-apps/init-data-node';

@Injectable()
export class TmaStrategy extends PassportStrategy(Strategy, 'tma') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([(req) => {
                const authToken = req.headers.authorization;
                const [authType, initDataRaw = ''] = (authToken || '').split(' ');
                console.log(initDataRaw)
                const data = parse(initDataRaw)
                console.log(data)
                return data.user
            }]),
            ignoreExpiration: false,
            secretOrKey: process.env.TELEGRAM_KEY,
        });
    }

    async validate(payload: any) {
        return payload; // Return relevant user data
    }
}
