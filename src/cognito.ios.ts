import { Common } from './cognito.common';
import { UserSession, ErrorObject } from "./index";

declare const AWSServiceConfiguration, AWSCognitoIdentityUserPoolConfiguration, AWSCognitoIdentityUserPool,
    AWSRegionUSEast1, AWSCognitoIdentityUserAttributeType, AWSRegionType, CFRunLoopGetMain, CFRunLoopPerformBlock, kCFRunLoopDefaultMode, CFRunLoopWakeUp;

// const main_queue = dispatch_get_current_queue();

//attempt to fix issue where dispatch_async sometimes never gets executed
//http://nuvious.com/Blog/2016/7/5/calling-dispatch_async-in-nativescript
const invokeOnRunLoop = (function() {
    var runloop = CFRunLoopGetMain();
    return function(func) {
        CFRunLoopPerformBlock(runloop, kCFRunLoopDefaultMode, func);
        CFRunLoopWakeUp(runloop);
    }
}());

export class Cognito extends Common {
    userPool = null;

    constructor(userPoolId, clientId, secret?, region?: Region) {
        super();

        const serviceConf = new AWSServiceConfiguration(
            AWSRegionType[region] || AWSRegionUSEast1,
            null
        );

        const conf = new AWSCognitoIdentityUserPoolConfiguration(
            clientId, secret, userPoolId
        );
        AWSCognitoIdentityUserPool
            .registerCognitoIdentityUserPoolWithConfigurationUserPoolConfigurationForKey(serviceConf, conf, "UserPool");
        this.userPool = AWSCognitoIdentityUserPool.CognitoIdentityUserPoolForKey("UserPool");
    }

    public getCurrentUser() {
        return this.userPool.currentUser();
    }

    private attributesFactory(attributes) {
        const userAttrs = [];
        Object.keys(attributes).forEach(key => {
            const attr = new AWSCognitoIdentityUserAttributeType();
            attr.name = key;
            attr.value = attributes[key];
            userAttrs.push(attr);
        });

        return userAttrs;
    }

    public signUp(userId, password, attributes) {

        return new Promise((resolve, reject) => {
            // @ts-ignore
            const callBack = t => {
                invokeOnRunLoop(() => {
                    if (t.error) reject(Cognito.getErrorObject(t.error));
                    else {
                        const { cognitoUser, userConfirmed, codeDeliveryDetails } = t.result;
                        resolve({ cognitoUser, userConfirmed, codeDeliveryDetails });
                    }
                });
                return null;
            };

            this.userPool
                .signUpPasswordUserAttributesValidationData(userId, password, this.attributesFactory(attributes), null)
                .continueWithBlock(callBack);
        });
    }

    public confirmRegistration(userId, confirmationCode, forcedAliasCreation = false) {
        const cognitoUser = this.userPool.getUser(userId);
        return new Promise((resolve, reject) => {
            // @ts-ignore
            const callBack = t => {
                invokeOnRunLoop(() => {
                    if (t.error) reject(Cognito.getErrorObject(t.error));
                    else {
                        resolve(cognitoUser.username);
                    }
                });
                return null;
            };

            cognitoUser
                .confirmSignUp(confirmationCode)
                .continueWithBlock(callBack);
        });
    }

    public resendCode(userId) {
        const cognitoUser = this.userPool.getUser(userId);
        return new Promise((resolve, reject) => {

            const callBack = t => {
                invokeOnRunLoop(() => {
                    if (t.error) reject(Cognito.getErrorObject(t.error));
                    else {
                        resolve(cognitoUser.username);
                    }
                });
                return null;
            };

            cognitoUser
                .resendConfirmationCode()
                .continueWithBlock(callBack);
        });
    }

    public authenticate(userId, password) {
        const cognitoUser = this.userPool.getUser(userId);

        return new Promise((resolve, reject) => {
            // @ts-ignore
            const callBack = t => {
                console.log('cognito: in getSessionPasswordValidationData() callback', t);
                if (t.error) {
                    console.log('cognito: in getSessionPasswordValidationData() error', t.error);
                    reject(Cognito.getErrorObject(t.error));
                } else {
                    console.log('cognito: in getSessionPasswordValidationData() success', t.result);
                    const session = t.result;
                    const data = Cognito.getSessionObject(session);
                    console.log('cognito: in getSessionPasswordValidationData() got session', data);
                    resolve(data);
                }
                return null;
            };

            cognitoUser
                .getSessionPasswordValidationData(userId, password, null)
                .continueWithBlock(callBack);
        });
    }

    public forgotPassword(userId) {
        const cognitoUser = this.userPool.getUser(userId);
        return new Promise((resolve, reject) => {

            const callBack = t => {
                invokeOnRunLoop(() => {
                    if (t.error) reject(Cognito.getErrorObject(t.error));
                    else {
                        resolve(cognitoUser.username);
                    }
                });
                return null;
            };

            cognitoUser
                .forgotPassword()
                .continueWithBlock(callBack);
        });
    }

    public confirmForgotPassword(userId: string, code: string, newPassword: string) {
        const cognitoUser = this.userPool.getUser(userId);
        return new Promise((resolve, reject) => {

            const callBack = t => {
                invokeOnRunLoop(() => {
                    if (t.error) reject(Cognito.getErrorObject(t.error));
                    else {
                        resolve(cognitoUser.username);
                    }
                });
                return null;
            };

            cognitoUser
                .confirmForgotPasswordPassword(code, newPassword)
                .continueWithBlock(callBack);
        });
    }

    public changePassword(userId, oldPassword, newPassword) {
        const cognitoUser = this.userPool.getUser(userId);
        return new Promise((resolve, reject) => {
            const callBack = t => {
                invokeOnRunLoop(() => {
                    if (t.error) reject(Cognito.getErrorObject(t.error));
                    else {
                        resolve(cognitoUser.username);
                    }
                });
                return null;
            };

            cognitoUser
                .changePasswordProposedPassword(oldPassword, newPassword)
                .continueWithBlock(callBack);
        });
    }

    public getCurrentUserSession() {
        return new Promise((resolve, reject) => {
            const callBack = t => {
                console.log('cognito: in getCurrentUserSession() callback', t);
                if (t.error) {
                    console.log('cognito: in getSessionPasswordValidationData() error', t.error);
                    reject(Cognito.getErrorObject(t.error));
                } else {
                    console.log('cognito: in getSessionPasswordValidationData() success', t.result);
                    const data = Cognito.getSessionObject(t.result);
                    resolve(data);
                }
                return null;
            };

            this.getCurrentUser()
                .getSession()
                .continueWithBlock(callBack);
        });
    }

    public deleteUser(userId) {
        const cognitoUser = this.userPool.getUser(userId);
        return new Promise((resolve, reject) => {
            const callBack = t => {
                invokeOnRunLoop(() => {
                    if (t.error) reject(Cognito.getErrorObject(t.error));
                    else {
                        resolve(cognitoUser.username);
                    }
                });
                return null;
            };

            cognitoUser
                .deleteUser()
                .continueWithBlock(callBack);
        });
    }

    public getUserDetails() {
        return new Promise((resolve, reject) => {
            const callBack = t => {
                invokeOnRunLoop(() => {
                    if (t.error) reject(Cognito.getErrorObject(t.error));
                    else {
                        const data = {};
                        const attrs = t.result.userAttributes;
                        for (let i = 0; i < attrs.count; i++)
                            data[attrs[i].name] = attrs[i].value;
                        resolve({
                            attributes: data,
                            settings: t.result.userMFASettingList
                        });
                    }
                });
                return null;
            };

            this.getCurrentUser()
                .getDetails()
                .continueWithBlock(callBack);
        });
    }

    public logout() {
        this.getCurrentUser().signOut();
    }

    private static getSessionObject = (session): UserSession => (
        {
            accessToken: {
                token: session.accessToken.tokenString,
                username: session.username,
                expiration: session.expirationTime
            },
            refreshToken: {
                token: session.refreshToken.tokenString
            },
            idToken: {
                token: session.idToken.tokenString,
                expiration: session.expirationTime,
                // issuedAt: session.getIdToken().getIssuedAt(),
            },
            isValidForThreshold: session.isValidForThreshold,
            username: session.username,
            isValid: session.isValid,
        } as UserSession
    )

    private static getErrorObject = (error): ErrorObject => (
        {
            code: error.userInfo.objectForKey("__type"),
            message: error.userInfo.objectForKey("message")
        } as ErrorObject
    )

}

export enum Region {
    UNKNOWN = 'Unknown',
    US_GOV_EAST_1 = 'USGovWest1',
    US_EAST_1 = 'USEast1',
    US_EAST_2 = 'USEast2',
    US_WEST_1 = 'USWest1',
    US_WEST_2 = 'USWest2',
    EU_WEST_1 = 'EUWest1',
    EU_WEST_2 = 'EUWest2',
    EU_WEST_3 = 'EUWest3',
    EU_CENTRAL_1 = 'EUCentral1',
    EU_NORTH_1 = 'EUNorth1',
    AP_SOUTH_1 = 'APSouth1',
    AP_SOUTHEAST_1 = 'APSoutheast1',
    AP_SOUTHEAST_2 = 'APSoutheast2',
    AP_NORTHEAST_1 = 'APNortheast1',
    AP_NORTHEAST_2 = 'APNortheast2',
    SA_EAST_1 = 'SAEast1',
    CA_CENTRAL_1 = 'CACentral1',
    CN_NORTH_1 = 'CNNorth1',
    CN_NORTHWEST_1 = 'CNNorthWest1',
    DEFAULT_REGION = 'DEFAULT_REGION',
}