import React, { useEffect, useState } from "react";
import { RootStateOrAny, useDispatch, useSelector } from "react-redux";
import { useUIContext } from "../../layout/context";
import { Field, SpTypeObject } from "../../utils/interfaces";

interface SpTypeFormProps {
  modulePath: string;
  moduleType: string;
  action: string;
  id?: string;
}

const SpTypeForm: React.FC<SpTypeFormProps> = ({
  modulePath = "",
  moduleType = "",
  action = "",
  id = "",
}) => {
  const { _depsLoaded, setDepsLoaded } = useUIContext();
  const reduxStore = useSelector((state: RootStateOrAny) => state);
  const dispatch = useDispatch();
  const [fieldList, setFieldList] = useState<Field[]>([]);
  const [typeData, setTypeData] = useState<SpTypeObject>({});
  const [inFlight, setInFlight] = useState<boolean>(false);

  useEffect(() => {
    if (reduxStore && !reduxStore[modulePath]) {
      setDepsLoaded(false);
    }
  }, [reduxStore]);

  useEffect(() => {
    //   const watchedId = async () => {
    //     setTypeData({ ...typeData, id: id })
    //     if (_depsLoaded) {
    //         if (id != '') {
    //             await dispatch(this.modulePath + '/Query' + this.moduleType, {
    //                 options: { subscribe: true },
    //                 params: { id: this.typeData['id'] },
    //             })
    //             const data = this.$store.getters[this.modulePath + '/get' + this.moduleType]({
    //                 params: { id: this.typeData['id'] },
    //             })
    //             this.typeData = data[this.capitalize(this.moduleType)]
    //         }
    //     }
    //   }
    
  }, [id])
  return (
      <>
      SpTypeForm
      </>
  );
};

export default SpTypeForm;
