/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {useAsyncRetry} from 'react-use';
import {codeStarApiRef} from '../api';
import {useApi} from '@backstage/core-plugin-api';
import {useEntity} from '@backstage/plugin-catalog-react';
import {IAM_ROLE_ANNOTATION} from '../constants';
import {PIPELINE_ARN_ANNOTATION} from '../constants';
import {PipelineExecutionSummary} from '@aws-sdk/client-codepipeline';

export function useCodePipelineExecutions() {
  const api = useApi(codeStarApiRef);
  const {entity} = useEntity();
  const iamRole = entity?.metadata.annotations?.[IAM_ROLE_ANNOTATION] ?? '';
  const pipelineARN = entity?.metadata.annotations?.[PIPELINE_ARN_ANNOTATION] ?? '';
  const {
    loading,
    value: pipelineRunsSummaries,
    error,
    retry
  } = useAsyncRetry<PipelineExecutionSummary[] | undefined>(async () => {
    const arnElements = pipelineARN.split(":")
    if (arnElements.length < 6)
      return undefined;

    const region = arnElements[3];
    const pipelineName = arnElements[5].split("/")[1]

    const creds = await api.generateCredentials({iamRole: iamRole});
    const pipelineRunsList = await api.getPipelineRuns({region: region, name: pipelineName, creds});
    if (pipelineRunsList?.pipelineExecutionSummaries === undefined) {
      return undefined;
    }
    return pipelineRunsList.pipelineExecutionSummaries;
  });

  return {loading, pipelineRunsSummaries, error, retry} as const;
}