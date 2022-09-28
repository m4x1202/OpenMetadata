/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  Form,
  Input,
  Radio,
  RadioChangeEvent,
  Select,
  Space,
  Switch,
} from 'antd';
import { AxiosError } from 'axios';
import classNames from 'classnames';
import { isUndefined } from 'lodash';
import { EditorContentRef } from 'Models';
import React, { useRef, useState } from 'react';
import { useAuthContext } from '../../authentication/auth-provider/AuthProvider';
import { generateRandomPwd } from '../../axiosAPIs/auth-API';
import { getBotsPagePath, getUsersPagePath } from '../../constants/constants';
import { validEmailRegEx } from '../../constants/regex.constants';
import { PageLayoutType } from '../../enums/layout.enum';
import {
  CreatePasswordGenerator,
  CreatePasswordType,
  CreateUser as CreateUserSchema,
} from '../../generated/api/teams/createUser';
import { Role } from '../../generated/entity/teams/role';
import {
  AuthType,
  EntityReference as UserTeams,
  JWTTokenExpiry,
  SsoServiceType,
} from '../../generated/entity/teams/user';
import { Auth0SSOClientConfig } from '../../generated/security/client/auth0SSOClientConfig';
import { AzureSSOClientConfig } from '../../generated/security/client/azureSSOClientConfig';
import { CustomOidcSSOClientConfig } from '../../generated/security/client/customOidcSSOClientConfig';
import { GoogleSSOClientConfig } from '../../generated/security/client/googleSSOClientConfig';
import { OktaSSOClientConfig } from '../../generated/security/client/oktaSSOClientConfig';
import jsonData from '../../jsons/en';
import {
  getAuthMechanismTypeOptions,
  getJWTTokenExpiryOptions,
} from '../../utils/BotsUtils';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import CopyToClipboardButton from '../buttons/CopyToClipboardButton/CopyToClipboardButton';
import RichTextEditor from '../common/rich-text-editor/RichTextEditor';
import TitleBreadcrumb from '../common/title-breadcrumb/title-breadcrumb.component';
import PageLayout from '../containers/PageLayout';
import DropDown from '../dropdown/DropDown';
import { DropDownListItem } from '../dropdown/types';
import Loader from '../Loader/Loader';
import TeamsSelectable from '../TeamsSelectable/TeamsSelectable';
import { CreateUserProps, SSOClientConfig } from './CreateUser.interface';

const { Option } = Select;

const CreateUser = ({
  roles,
  saveState = 'initial',
  onCancel,
  onSave,
  forceBot,
}: CreateUserProps) => {
  const [form] = Form.useForm();
  const { authConfig } = useAuthContext();
  const markdownRef = useRef<EditorContentRef>();
  const [description] = useState<string>('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBot, setIsBot] = useState(forceBot);
  const [selectedRoles, setSelectedRoles] = useState<Array<string | undefined>>(
    []
  );
  const [selectedTeams, setSelectedTeams] = useState<Array<string | undefined>>(
    []
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordGenerator, setPasswordGenerator] = useState(
    CreatePasswordGenerator.AutomatciGenerate
  );
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isPasswordGenerating, setIsPasswordGenerating] = useState(false);
  const [authMechanism, setAuthMechanism] = useState<AuthType>(AuthType.Jwt);
  const [tokenExpiry, setTokenExpiry] = useState<JWTTokenExpiry>(
    JWTTokenExpiry.OneHour
  );

  const [ssoClientConfig, setSSOClientConfig] = useState<SSOClientConfig>(
    {} as SSOClientConfig
  );

  const slashedBreadcrumbList = [
    {
      name: forceBot ? 'Bots' : 'Users',
      url: forceBot ? getBotsPagePath() : getUsersPagePath(),
    },
    {
      name: `Create ${forceBot ? 'Bot' : 'User'}`,
      url: '',
      activeTitle: true,
    },
  ];

  /**
   * Handle on change event
   * @param event
   */
  const handleOnChange = (
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      | RadioChangeEvent
  ) => {
    const value = event.target.value;
    const eleName = event.target.name;

    switch (eleName) {
      case 'email':
        setEmail(value);

        break;

      case 'displayName':
        setDisplayName(value);

        break;
      case 'secretKey':
        setSSOClientConfig((previous) => ({
          ...previous,
          secretKey: value,
        }));

        break;
      case 'audience':
        setSSOClientConfig((previous) => ({
          ...previous,
          audience: value,
        }));

        break;
      case 'clientId':
        setSSOClientConfig((previous) => ({
          ...previous,
          clientId: value,
        }));

        break;
      case 'domain':
        setSSOClientConfig((previous) => ({
          ...previous,
          domain: value,
        }));

        break;
      case 'clientSecret':
        setSSOClientConfig((previous) => ({
          ...previous,
          clientSecret: value,
        }));

        break;
      case 'authority':
        setSSOClientConfig((previous) => ({
          ...previous,
          authority: value,
        }));

        break;
      case 'scopes':
        setSSOClientConfig((previous) => ({
          ...previous,
          scopes: value ? value.split(',') : [],
        }));

        break;
      case 'privateKey':
        setSSOClientConfig((previous) => ({
          ...previous,
          privateKey: value,
        }));

        break;
      case 'orgURL':
        setSSOClientConfig((previous) => ({
          ...previous,
          orgURL: value,
        }));

        break;
      case 'oktaEmail':
        setSSOClientConfig((previous) => ({
          ...previous,
          email: value,
        }));

        break;
      case 'tokenEndpoint':
        setSSOClientConfig((previous) => ({
          ...previous,
          tokenEndpoint: value,
        }));

        break;

      case 'password':
        setPassword(value);

        break;

      case 'confirmPassword':
        setConfirmPassword(value);

        break;

      case 'passwordGenerator':
        setPasswordGenerator(value);

        break;

      default:
        break;
    }
  };

  /**
   * Generate DropdownListItem
   * @param data Array containing object which must have name and id
   * @returns DropdownListItem[]
   */
  const getDropdownOptions = (
    data: Array<Role> | Array<UserTeams>
  ): DropDownListItem[] => {
    return [
      ...data.map((option) => {
        return {
          name: option.displayName || option.name || '',
          value: option.id,
        };
      }),
    ];
  };

  /**
   * Dropdown option selector
   * @param id of selected option from dropdown
   */
  const selectedRolesHandler = (id?: string) => {
    setSelectedRoles((prevState: Array<string | undefined>) => {
      if (prevState.includes(id as string)) {
        const selectedRole = [...prevState];
        const index = selectedRole.indexOf(id as string);
        selectedRole.splice(index, 1);

        return selectedRole;
      } else {
        return [...prevState, id];
      }
    });
  };

  //   *******  Generate Random Passwprd  *****
  const generateRandomPassword = async () => {
    setIsPasswordGenerating(true);
    try {
      const password = await generateRandomPwd();
      setTimeout(() => {
        setGeneratedPassword(password);
        form.setFieldsValue({ generatedPassword: password });
      }, 500);
    } catch (err) {
      showErrorToast(err as AxiosError);
    } finally {
      setIsPasswordGenerating(false);
    }
  };

  /**
   * Form submit handler
   */
  const handleSave = () => {
    const isPasswordGenerated =
      passwordGenerator === CreatePasswordGenerator.AutomatciGenerate;
    const validRole = selectedRoles.filter(
      (id) => !isUndefined(id)
    ) as string[];
    const validTeam = selectedTeams.filter(
      (id) => !isUndefined(id)
    ) as string[];

    const userProfile: CreateUserSchema = {
      description: markdownRef.current?.getEditorContent() || undefined,
      name: email.split('@')[0],
      displayName,
      roles: validRole.length ? validRole : undefined,
      teams: validTeam.length ? validTeam : undefined,
      email: email,
      isAdmin: isAdmin,
      isBot: isBot,
      password: isPasswordGenerated ? generatedPassword : password,
      confirmPassword: isPasswordGenerated
        ? generatedPassword
        : confirmPassword,
      createPasswordType: CreatePasswordType.Admincreate,
      ...(forceBot
        ? {
            authenticationMechanism: {
              authType: authMechanism,
              config:
                authMechanism === AuthType.Jwt
                  ? {
                      JWTTokenExpiry: tokenExpiry,
                    }
                  : {
                      ssoServiceType: authConfig?.provider as SsoServiceType,
                      authConfig: {
                        ...ssoClientConfig,
                      },
                    },
            },
          }
        : {}),
    };
    onSave(userProfile);
  };

  const getSSOConfig = () => {
    switch (authConfig?.provider) {
      case SsoServiceType.Google: {
        const googleConfig = ssoClientConfig as GoogleSSOClientConfig;

        return (
          <>
            <Form.Item
              label="SecretKey"
              name="secretKey"
              rules={[
                {
                  required: true,
                  message: 'SecretKey is required',
                },
              ]}>
              <Input.Password
                data-testid="secretKey"
                name="secretKey"
                placeholder="secretKey"
                value={googleConfig.secretKey}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item label="Audience" name="audience">
              <Input
                data-testid="audience"
                name="audience"
                placeholder="audience"
                value={googleConfig.audience}
                onChange={handleOnChange}
              />
            </Form.Item>
          </>
        );
      }

      case SsoServiceType.Auth0: {
        const auth0Config = ssoClientConfig as Auth0SSOClientConfig;

        return (
          <>
            <Form.Item
              label="SecretKey"
              name="secretKey"
              rules={[
                {
                  required: true,
                  message: 'SecretKey is required',
                },
              ]}>
              <Input.Password
                data-testid="secretKey"
                name="secretKey"
                placeholder="secretKey"
                value={auth0Config.secretKey}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="ClientId"
              name="clientId"
              rules={[
                {
                  required: true,
                  message: 'ClientId is required',
                },
              ]}>
              <Input
                data-testid="clientId"
                name="clientId"
                placeholder="clientId"
                value={auth0Config.clientId}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="Domain"
              name="domain"
              rules={[
                {
                  required: true,
                  message: 'Domain is required',
                },
              ]}>
              <Input
                data-testid="domain"
                name="domain"
                placeholder="domain"
                value={auth0Config.domain}
                onChange={handleOnChange}
              />
            </Form.Item>
          </>
        );
      }
      case SsoServiceType.Azure: {
        const azureConfig = ssoClientConfig as AzureSSOClientConfig;

        return (
          <>
            <Form.Item
              label="ClientSecret"
              name="clientSecret"
              rules={[
                {
                  required: true,
                  message: 'ClientSecret is required',
                },
              ]}>
              <Input.Password
                data-testid="clientSecret"
                name="clientSecret"
                placeholder="clientSecret"
                value={azureConfig.clientSecret}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="ClientId"
              name="clientId"
              rules={[
                {
                  required: true,
                  message: 'ClientId is required',
                },
              ]}>
              <Input
                data-testid="clientId"
                name="clientId"
                placeholder="clientId"
                value={azureConfig.clientId}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="Authority"
              name="authority"
              rules={[
                {
                  required: true,
                  message: 'Authority is required',
                },
              ]}>
              <Input
                data-testid="authority"
                name="authority"
                placeholder="authority"
                value={azureConfig.authority}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="Scopes"
              name="scopes"
              rules={[
                {
                  required: true,
                  message: 'Scopes is required',
                },
              ]}>
              <Input
                data-testid="scopes"
                name="scopes"
                placeholder="Scopes value comma separated"
                value={azureConfig.scopes}
                onChange={handleOnChange}
              />
            </Form.Item>
          </>
        );
      }
      case SsoServiceType.Okta: {
        const oktaConfig = ssoClientConfig as OktaSSOClientConfig;

        return (
          <>
            <Form.Item
              label="PrivateKey"
              name="privateKey"
              rules={[
                {
                  required: true,
                  message: 'PrivateKey is required',
                },
              ]}>
              <Input.Password
                data-testid="privateKey"
                name="privateKey"
                placeholder="privateKey"
                value={oktaConfig.privateKey}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="ClientId"
              name="clientId"
              rules={[
                {
                  required: true,
                  message: 'ClientId is required',
                },
              ]}>
              <Input
                data-testid="clientId"
                name="clientId"
                placeholder="clientId"
                value={oktaConfig.clientId}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="OrgURL"
              name="orgURL"
              rules={[
                {
                  required: true,
                  message: 'OrgURL is required',
                },
              ]}>
              <Input
                data-testid="orgURL"
                name="orgURL"
                placeholder="orgURL"
                value={oktaConfig.orgURL}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="Email"
              name="oktaEmail"
              rules={[
                {
                  required: true,
                  type: 'email',
                  message: 'Service account Email is required',
                },
              ]}>
              <Input
                data-testid="oktaEmail"
                name="oktaEmail"
                placeholder="Okta Service account Email"
                value={oktaConfig.email}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item label="Scopes" name="scopes">
              <Input
                data-testid="scopes"
                name="scopes"
                placeholder="Scopes value comma separated"
                value={oktaConfig.scopes}
                onChange={handleOnChange}
              />
            </Form.Item>
          </>
        );
      }
      case SsoServiceType.CustomOidc: {
        const customOidcConfig = ssoClientConfig as CustomOidcSSOClientConfig;

        return (
          <>
            <Form.Item
              label="SecretKey"
              name="secretKey"
              rules={[
                {
                  required: true,
                  message: 'SecretKey is required',
                },
              ]}>
              <Input.Password
                data-testid="secretKey"
                name="secretKey"
                placeholder="secretKey"
                value={customOidcConfig.secretKey}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="ClientId"
              name="clientId"
              rules={[
                {
                  required: true,
                  message: 'ClientId is required',
                },
              ]}>
              <Input
                data-testid="clientId"
                name="clientId"
                placeholder="clientId"
                value={customOidcConfig.clientId}
                onChange={handleOnChange}
              />
            </Form.Item>
            <Form.Item
              label="TokenEndpoint"
              name="tokenEndpoint"
              rules={[
                {
                  required: true,
                  message: 'TokenEndpoint is required',
                },
              ]}>
              <Input
                data-testid="tokenEndpoint"
                name="tokenEndpoint"
                placeholder="tokenEndpoint"
                value={customOidcConfig.tokenEndpoint}
                onChange={handleOnChange}
              />
            </Form.Item>
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <PageLayout
      classes="tw-max-w-full-hd tw-h-full tw-pt-4"
      header={<TitleBreadcrumb titleLinks={slashedBreadcrumbList} />}
      layout={PageLayoutType['2ColRTL']}>
      <div className="tw-form-container">
        <h6 className="tw-heading tw-text-base">
          Create {forceBot ? 'Bot' : 'User'}
        </h6>
        <Form
          form={form}
          id="create-user-bot-form"
          layout="vertical"
          onFinish={handleSave}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                type: 'email',
                message: jsonData['form-error-messages']['empty-email'],
              },
              {
                pattern: validEmailRegEx,
                type: 'email',
                message: jsonData['form-error-messages']['invalid-email'],
              },
            ]}>
            <Input
              data-testid="email"
              name="email"
              placeholder="email"
              value={email}
              onChange={handleOnChange}
            />
          </Form.Item>
          <Form.Item label="Display Name" name="displayName">
            <Input
              data-testid="displayName"
              name="displayName"
              placeholder="displayName"
              value={displayName}
              onChange={handleOnChange}
            />
          </Form.Item>
          {forceBot && (
            <>
              <Form.Item
                label="Auth Mechanism"
                name="auth-mechanism"
                rules={[
                  {
                    required: true,
                    validator: () => {
                      if (!authMechanism) {
                        return Promise.reject('Auth Mechanism is required');
                      }

                      return Promise.resolve();
                    },
                  },
                ]}>
                <Select
                  className="w-full"
                  data-testid="auth-mechanism"
                  defaultValue={authMechanism}
                  placeholder="Select Auth Mechanism"
                  onChange={(value) => setAuthMechanism(value)}>
                  {getAuthMechanismTypeOptions(authConfig).map((option) => (
                    <Option key={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
              {authMechanism === AuthType.Jwt && (
                <Form.Item
                  label="Token Expiration"
                  name="token-expiration"
                  rules={[
                    {
                      required: true,
                      validator: () => {
                        if (!tokenExpiry) {
                          return Promise.reject('Token Expiration is required');
                        }

                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <Select
                    className="w-full"
                    data-testid="token-expiry"
                    defaultValue={tokenExpiry}
                    placeholder="Select Token Expiration"
                    onChange={(value) => setTokenExpiry(value)}>
                    {getJWTTokenExpiryOptions().map((option) => (
                      <Option key={option.value}>{option.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
              {authMechanism === AuthType.Sso && <>{getSSOConfig()}</>}
            </>
          )}
          <Form.Item label="Description" name="description">
            <RichTextEditor initialValue={description} ref={markdownRef} />
          </Form.Item>

          <Radio.Group
            name="passwordGenerator"
            value={passwordGenerator}
            onChange={handleOnChange}>
            <Radio value={CreatePasswordGenerator.AutomatciGenerate}>
              Automatic Generate
            </Radio>
            <Radio value={CreatePasswordGenerator.CreatePassword}>
              Create Password
            </Radio>
          </Radio.Group>

          {passwordGenerator === CreatePasswordGenerator.CreatePassword ? (
            <div className="m-t-sm">
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {
                    required: true,
                  },
                ]}>
                <Input.Password
                  name="password"
                  placeholder="Enter a Password"
                  value={password}
                  onChange={handleOnChange}
                />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                rules={[
                  {
                    required: true,
                  },
                  {
                    validator: (_, value) => {
                      if (value !== password) {
                        return Promise.reject("Password doesn't match");
                      }

                      return Promise.resolve();
                    },
                  },
                ]}>
                <Input.Password
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={handleOnChange}
                />
              </Form.Item>
            </div>
          ) : (
            <div className="m-t-sm">
              <Form.Item
                label="Generated Password"
                name="generatedPassword"
                rules={[
                  {
                    required: true,
                  },
                ]}>
                <Input
                  readOnly
                  addonAfter={
                    <div className="tw-flex tw-items-center">
                      <div
                        className="tw-w-8 flex-center cursor-pointer"
                        onClick={generateRandomPassword}>
                        {isPasswordGenerating ? (
                          <Loader size="small" type="default" />
                        ) : (
                          <SVGIcons
                            alt="generate"
                            icon={Icons.SYNC}
                            width="14"
                          />
                        )}
                      </div>

                      <CopyToClipboardButton copyText={generatedPassword} />
                    </div>
                  }
                  name="generatedPassword"
                  value={generatedPassword}
                />
              </Form.Item>
            </div>
          )}

          {!forceBot && (
            <>
              <Form.Item label="Teams" name="teams">
                <TeamsSelectable onSelectionChange={setSelectedTeams} />
              </Form.Item>
              <Form.Item label="Roles" name="roles">
                <DropDown
                  className={classNames('tw-bg-white', {
                    'tw-bg-gray-100 tw-cursor-not-allowed': roles.length === 0,
                  })}
                  dataTestId="roles-dropdown"
                  dropDownList={getDropdownOptions(roles) as DropDownListItem[]}
                  label="Roles"
                  selectedItems={selectedRoles as Array<string>}
                  type="checkbox"
                  onSelect={(_e, value) => selectedRolesHandler(value)}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <span>Admin</span>
                  <Switch
                    checked={isAdmin}
                    data-testid="admin"
                    onChange={() => {
                      setIsAdmin((prev) => !prev);
                      setIsBot(false);
                    }}
                  />
                </Space>
              </Form.Item>
            </>
          )}

          <Space className="w-full tw-justify-end" size={4}>
            <Button data-testid="cancel-user" type="link" onClick={onCancel}>
              Cancel
            </Button>
            <>
              {saveState === 'waiting' ? (
                <Button disabled type="primary">
                  <Loader size="small" type="white" />
                </Button>
              ) : saveState === 'success' ? (
                <Button disabled type="primary">
                  <FontAwesomeIcon icon="check" />
                </Button>
              ) : (
                <Button
                  data-testid="save-user"
                  form="create-user-bot-form"
                  htmlType="submit"
                  type="primary">
                  Create
                </Button>
              )}
            </>
          </Space>
        </Form>
      </div>
    </PageLayout>
  );
};

export default CreateUser;
