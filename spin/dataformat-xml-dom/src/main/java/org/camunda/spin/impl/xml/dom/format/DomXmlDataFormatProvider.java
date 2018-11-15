/*
 * Copyright © 2014 - 2018 camunda services GmbH and various authors (info@camunda.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.camunda.spin.impl.xml.dom.format;

import org.camunda.spin.DataFormats;
import org.camunda.spin.spi.DataFormat;
import org.camunda.spin.spi.DataFormatProvider;

/**
 * Provides the {@link DomXmlDataFormat} with default configuration.
 *
 * @author Daniel Meyer
 *
 */
public class DomXmlDataFormatProvider implements DataFormatProvider {

  public String getDataFormatName() {
    return DataFormats.XML_DATAFORMAT_NAME;
  }

  public DataFormat<?> createInstance() {
    return new DomXmlDataFormat(DataFormats.XML_DATAFORMAT_NAME);
  }

}
